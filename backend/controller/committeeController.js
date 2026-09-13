import { query, pool } from '../config/db.js';
import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createNotification } from './notificationController.js';
import { getCache, setCache, delCachePattern } from '../config/redis.js';
import { onPaymentConfirmed, onCycleClosed, onCommitteeClosed, onMemberRemoved } from '../utilities/trustScore.js';

/**
 * Resolve the requesting user's role within a committee.
 * Returns 'organizer' | 'co_organizer' | 'member' | 'viewer' | null.
 */
async function getMyRole(committeeId, userId) {
  if (!userId) return null;
  const res = await query(
    `SELECT
       CASE
         WHEN EXISTS (SELECT 1 FROM organizers o WHERE o.committee_id = $1 AND o.user_id = $2) THEN 'organizer'
         WHEN EXISTS (SELECT 1 FROM co_organizers co WHERE co.committee_id = $1 AND co.user_id = $2 AND co.demoted_at IS NULL) THEN 'co_organizer'
         WHEN EXISTS (SELECT 1 FROM members m WHERE m.committee_id = $1 AND m.user_id = $2) THEN 'member'
         ELSE 'viewer'
       END AS role`,
    [committeeId, userId]
  );
  return res.rows[0].role;
}

/**
 * True if the user is the committee's Organizer or an active Co-Organizer.
 */
async function isManagementUser(committeeId, userId) {
  const role = await getMyRole(committeeId, userId);
  return role === 'organizer' || role === 'co_organizer';
}

const SYSTEM_EXTRACTION_PROMPT = `You are an expert multilingual assistant for a Pakistani Peer-to-Peer Savings Committee (Kameti / BC / Chit Fund) app called Sanjhi.
Extract committee parameters from user input which can be in English, Urdu (Arabic script), Roman Urdu (English alphabet Urdu like "18 members, har mahine 2500 dena, commitee ka name Sabzazar Al-Kareem store"), or Hindi.

Extract the following JSON schema strictly:
{
  "name": string (The name of the committee. If mentioned in quotes or with "name ...", extract the exact name cleanly without extra quotes. If no name specified, return a meaningful title like "Savings Pool"),
  "contribution_amount": number (The periodic contribution amount in PKR per member, e.g. 2500, 5000. Convert Urdu terms like "5 hazar" -> 5000, "dus hazar" -> 10000),
  "capacity": number (Total number of members/slots, e.g. 18. Understand terms like "18 members", "18 log", "18 banday", "18 afraad", "18 mahine duration"),
  "interval_type": "15_days" | "1_month" | "2_months" (Default to "1_month" unless specified like "15 din", "har 15 din" -> "15_days", "do mahine" -> "2_months")
}

Return ONLY valid JSON matching this schema. No explanations, no markdown formatting outside of JSON.`;

/**
 * Fallback smart regex parser for Roman Urdu, Urdu and English if Groq is unavailable
 */
function fallbackLocalParse(text) {
  let name = '';
  const nameQuoteMatch = text.match(/["']([^"']+)["']/);
  if (nameQuoteMatch) {
    name = nameQuoteMatch[1].trim();
  } else {
    const nameMatch = text.match(/(?:name|naam|nam)\s*(?:is|hoga|rakho|:)?\s*([a-zA-Z0-9\s\-]+?)(?:\s*(?:hoga|rakho|aur|with|$))/i);
    if (nameMatch && nameMatch[1].trim().length > 2) {
      name = nameMatch[1].trim();
    } else {
      name = 'Sanjhi Savings Pool';
    }
  }

  const memberMatch = text.match(/(\d+)\s*(?:members?|log|banday|afraad|person|people|mahine|months?)/i);
  const capacity = memberMatch ? parseInt(memberMatch[1], 10) : 10;

  let contribution_amount = 5000;
  const thousandMatch = text.match(/(\d+)\s*(?:hazar|hazaar|k\b)/i);
  const directAmountMatch = text.match(/(?:Rs\.?|pkr|inr|\$)?\s*(\d{3,7})/i);
  
  if (thousandMatch) {
    contribution_amount = parseInt(thousandMatch[1], 10) * 1000;
  } else if (directAmountMatch) {
    contribution_amount = parseInt(directAmountMatch[1], 10);
  }

  let interval_type = '1_month';
  if (/15\s*(?:din|days?)/i.test(text)) interval_type = '15_days';
  if (/2\s*(?:mahine|months?)/i.test(text)) interval_type = '2_months';

  return {
    name,
    contribution_amount,
    capacity,
    interval_type,
  };
}

export async function parseCommitteeAIText(req, res) {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required.' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here' || apiKey.trim() === '') {
      const parsed = fallbackLocalParse(text);
      return res.status(200).json({ parsed });
    }

    const groq = new Groq({ apiKey });

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_EXTRACTION_PROMPT },
        { role: 'user', content: `Extract from this text: "${text}"` }
      ],
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const parsedContent = JSON.parse(chatCompletion.choices[0].message.content);
    return res.status(200).json({ parsed: parsedContent });
  } catch (error) {
    console.error('Error in parseCommitteeAIText, using fallback:', error.message);
    const parsed = fallbackLocalParse(req.body?.text || '');
    return res.status(200).json({ parsed });
  }
}

function normalizeIntervalType(input) {
  if (!input) return '1_month';
  const str = input.toString().toLowerCase().replace(/[\s-]/g, '_');
  if (str.includes('15')) return '15_days';
  if (str.includes('2')) return '2_months';
  return '1_month';
}

function normalizeAccountType(input) {
  if (!input) return 'jazzcash';
  const str = input.toString().toLowerCase();
  if (str.includes('easy')) return 'easypaisa';
  if (str.includes('bank')) return 'bank';
  return 'jazzcash';
}

function generateInviteCode() {
  const num = Math.floor(1000 + Math.random() * 9000);
  const char = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `SANJHI-${num}${char}`;
}

function calculateDueDate(startDate, cycleIndex, intervalType) {
  const d = new Date(startDate);
  if (intervalType === '15_days') {
    d.setDate(d.getDate() + (cycleIndex - 1) * 15);
  } else if (intervalType === '2_months') {
    d.setMonth(d.getMonth() + (cycleIndex - 1) * 2);
  } else {
    d.setMonth(d.getMonth() + (cycleIndex - 1));
  }
  return d.toISOString().split('T')[0];
}

export async function createCommittee(req, res) {
  const client = await pool.connect();

  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required to create a committee.' });
    }

    const {
      name,
      contribution_amount,
      contributionAmount,
      capacity,
      interval_type,
      intervalType,
      collection_account,
      account_title,
      account_number,
      account_type,
      accountTitle,
      accountNumber,
      provider,
      startDate,
      is_public,
      category,
      description,
      rules,
    } = req.body;

    const committeeName = (name || 'New Savings Committee').trim();
    const amount = parseFloat(contribution_amount || contributionAmount || 5000);
    const cap = parseInt(capacity, 10) || 10;
    const normInterval = normalizeIntervalType(interval_type || intervalType);
    const normProvider = normalizeAccountType(
      collection_account?.account_type || collection_account?.provider || account_type || provider
    );
    const accTitle = (
      collection_account?.account_title || collection_account?.accountTitle || account_title || accountTitle || 'Primary Account'
    ).trim();
    const accNum = (
      collection_account?.account_number || collection_account?.accountNumber || account_number || accountNumber || '03000000000'
    ).trim();

    if (amount <= 0 || cap <= 1) {
      return res.status(400).json({ error: 'Valid contribution amount (>0) and member capacity (>1) are required.' });
    }

    const isPublic = Boolean(is_public);
    const cleanCategory = category ? String(category).trim().slice(0, 50) : null;
    const cleanDescription = description ? String(description).trim() : null;
    const cleanRules = rules ? String(rules).trim() : null;

    const inviteCode = generateInviteCode();
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/join/${inviteCode}`;

    await client.query('BEGIN');

    const committeeRes = await client.query(
      `INSERT INTO committees (
        created_by, name, contribution_amount, capacity, interval_type, duration_cycles, payout_order_type, status, invite_code, invite_link,
        is_public, category, description, rules
      ) VALUES ($1, $2, $3, $4, $5, $6, 'fixed', 'active', $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [userId, committeeName, amount, cap, normInterval, cap, inviteCode, inviteLink, isPublic, cleanCategory, cleanDescription, cleanRules]
    );

    const committee = committeeRes.rows[0];

    const accountRes = await client.query(
      `INSERT INTO collection_accounts (
        committee_id, account_type, account_number, account_title, is_active
      ) VALUES ($1, $2, $3, $4, true)
      RETURNING *`,
      [committee.id, normProvider, accNum, accTitle]
    );

    await client.query(
      `INSERT INTO organizers (user_id, committee_id) VALUES ($1, $2)`,
      [userId, committee.id]
    );

    await client.query(
      `INSERT INTO members (user_id, committee_id, status, payout_turn_order, joined_at)
       VALUES ($1, $2, 'approved', 1, NOW())`,
      [userId, committee.id]
    );

    const cycleStartDate = startDate ? new Date(startDate) : new Date();
    const cyclesCreated = [];

    for (let i = 1; i <= cap; i++) {
      const dueDateStr = calculateDueDate(cycleStartDate, i, normInterval);
      const recipientId = i === 1 ? userId : null;

      const cycleRes = await client.query(
        `INSERT INTO cycles (
          committee_id, cycle_number, due_date, status, recipient_user_id, payout_status
        ) VALUES ($1, $2, $3, 'collecting', $4, 'pending')
        RETURNING *`,
        [committee.id, i, dueDateStr, recipientId]
      );

      cyclesCreated.push(cycleRes.rows[0]);
    }

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Committee created successfully!',
      committee,
      collectionAccount: accountRes.rows[0],
      inviteCode: committee.invite_code,
      inviteLink: committee.invite_link,
      totalCycles: cap,
      cyclesCreatedCount: cyclesCreated.length,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating committee:', error);
    return res.status(500).json({ error: error.message || 'Failed to create committee in database.' });
  } finally {
    client.release();
  }
}

export async function getMyCommittees(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const committeesRes = await query(
      `SELECT DISTINCT c.*,
        ca.account_type, ca.account_number, ca.account_title,
        (SELECT COUNT(*) FROM members m WHERE m.committee_id = c.id AND m.status = 'approved') AS member_count,
        CASE 
          WHEN o.user_id = $1 THEN 'organizer'
          WHEN co.user_id = $1 AND co.demoted_at IS NULL THEN 'co_organizer'
          ELSE 'member'
        END AS my_role
       FROM committees c
       LEFT JOIN collection_accounts ca ON ca.committee_id = c.id AND ca.is_active = true
       LEFT JOIN organizers o ON o.committee_id = c.id
       LEFT JOIN co_organizers co ON co.committee_id = c.id
       LEFT JOIN members m ON m.committee_id = c.id
       WHERE o.user_id = $1 OR co.user_id = $1 OR m.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      committees: committeesRes.rows,
    });
  } catch (error) {
    console.error('Error fetching committees:', error);
    return res.status(500).json({ error: 'Failed to fetch committees.' });
  }
}

export async function getCommittee(req, res) {
  try {
    const { id } = req.params;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      return res.status(404).json({ error: 'Committee not found.' });
    }

    const committeeRes = await query(
      `SELECT c.*,
        ca.account_type, ca.account_number, ca.account_title,
        u.full_name AS organizer_name, u.email AS organizer_email, u.phone_number AS organizer_phone
       FROM committees c
       LEFT JOIN collection_accounts ca ON ca.committee_id = c.id AND ca.is_active = true
       LEFT JOIN users u ON u.id = c.created_by
       WHERE c.id = $1`,
      [id]
    );

    if (committeeRes.rows.length === 0) {
      return res.status(404).json({ error: 'Committee not found.' });
    }

    const committee = committeeRes.rows[0];

    const myRole = await getMyRole(id, req.user?.userId);

    const myMemberRes = await query(
      `SELECT id FROM members WHERE committee_id = $1 AND user_id = $2`,
      [id, req.user?.userId]
    );

    const membersRes = await query(
      `SELECT m.*, u.full_name, u.email, u.phone_number, u.profile_photo_url,
        ts.score AS trust_score,
        EXISTS (SELECT 1 FROM organizers o WHERE o.committee_id = m.committee_id AND o.user_id = m.user_id) AS is_organizer,
        EXISTS (SELECT 1 FROM co_organizers co WHERE co.committee_id = m.committee_id AND co.user_id = m.user_id AND co.demoted_at IS NULL) AS is_co_organizer,
        (SELECT co.id FROM co_organizers co WHERE co.committee_id = m.committee_id AND co.user_id = m.user_id AND co.demoted_at IS NULL LIMIT 1) AS co_organizer_id
       FROM members m
       JOIN users u ON u.id = m.user_id
       LEFT JOIN trust_scores ts ON ts.user_id = u.id
       WHERE m.committee_id = $1
       ORDER BY m.payout_turn_order ASC NULLS LAST, m.created_at ASC`,
      [id]
    );

    const cyclesRes = await query(
      `SELECT cy.*, u.full_name AS recipient_name
       FROM cycles cy
       LEFT JOIN users u ON u.id = cy.recipient_user_id
       WHERE cy.committee_id = $1
       ORDER BY cy.cycle_number ASC`,
      [id]
    );

    return res.status(200).json({
      committee: { ...committee, my_role: myRole },
      my_member_id: myMemberRes.rows.length > 0 ? myMemberRes.rows[0].id : null,
      members: membersRes.rows,
      cycles: cyclesRes.rows,
    });
  } catch (error) {
    console.error('Error fetching committee details:', error);
    return res.status(500).json({ error: 'Failed to fetch committee details.' });
  }
}

export async function parseCommitteeAIAudio(req, res) {
  const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.webm`);
  try {
    if (!req.file) return res.status(400).json({ error: 'Audio file is required.' });
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    fs.writeFileSync(tempFilePath, req.file.buffer);

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-large-v3-turbo",
    });

    const chatCompletion = await groq.chat.completions.create({
      messages: [{
        role: "system",
        content: SYSTEM_EXTRACTION_PROMPT
      }, {
        role: "user",
        content: `Extract from this text: "${transcription.text}"`
      }],
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      max_tokens: 500,
      response_format: { type: "json_object" },
    });
    
    return res.status(200).json({ parsed: JSON.parse(chatCompletion.choices[0].message.content), transcript: transcription.text });
  } catch (error) {
    console.error('Error in parseCommitteeAIAudio:', error);
    if (req.body?.text) {
      const parsed = fallbackLocalParse(req.body.text);
      return res.status(200).json({ parsed, transcript: req.body.text });
    }
    return res.status(500).json({ error: 'Failed to process audio.' });
  } finally {
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
  }
}

export async function getCommitteeByCode(req, res) {
  try {
    const { code } = req.params;
    if (!code) return res.status(400).json({ error: 'Invite code is required.' });

    const committeeRes = await query(
      `SELECT c.*,
        ca.account_type, ca.account_number, ca.account_title,
        u.full_name AS organizer_name
       FROM committees c
       LEFT JOIN collection_accounts ca ON ca.committee_id = c.id AND ca.is_active = true
       LEFT JOIN users u ON u.id = c.created_by
       WHERE c.invite_code = $1 AND c.status = 'active'`,
      [code.trim().toUpperCase()]
    );

    if (committeeRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or inactive committee invite code.' });
    }

    return res.status(200).json({ committee: committeeRes.rows[0] });
  } catch (error) {
    console.error('Error fetching committee by code:', error);
    return res.status(500).json({ error: 'Failed to fetch committee.' });
  }
}

export async function joinByCode(req, res) {
  try {
    const userId = req.user?.userId;
    const { invite_code } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!invite_code) {
      return res.status(400).json({ error: 'Invite code is required.' });
    }

    const committeeRes = await query(
      `SELECT * FROM committees WHERE invite_code = $1 AND status = 'active'`,
      [invite_code.trim().toUpperCase()]
    );

    if (committeeRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or inactive committee invite code.' });
    }

    const committee = committeeRes.rows[0];

    // Prevent users from joining committees they already belong to
    const existingRoleRes = await query(
      `SELECT
         CASE
           WHEN EXISTS (SELECT 1 FROM organizers o WHERE o.committee_id = $1 AND o.user_id = $2) THEN 'organizer'
           WHEN EXISTS (SELECT 1 FROM co_organizers co WHERE co.committee_id = $1 AND co.user_id = $2 AND co.demoted_at IS NULL) THEN 'co_organizer'
           WHEN EXISTS (SELECT 1 FROM members m WHERE m.committee_id = $1 AND m.user_id = $2 AND m.status IN ('approved', 'pending')) THEN 'member'
           ELSE NULL
         END AS role`,
      [committee.id, userId]
    );
    if (existingRoleRes.rows[0]?.role) {
      return res.status(400).json({ error: 'You are already a member of this committee.' });
    }

    if (committee.is_public) {
      const userRes = await query(
        `SELECT cnic_status FROM users WHERE id = $1`,
        [userId]
      );
      const cnicStatus = userRes.rows[0]?.cnic_status || 'unverified';
      if (cnicStatus !== 'verified') {
        return res.status(403).json({
          code: 'CNIC_REQUIRED',
          error: 'CNIC verification is required to join a public committee.',
          cnic_status: cnicStatus,
        });
      }
    }

    const memberRes = await query(
      `INSERT INTO members (user_id, committee_id, status, joined_at)
       VALUES ($1, $2, 'pending', NOW())
       ON CONFLICT (user_id, committee_id) DO UPDATE SET status = 'pending', joined_at = NOW()
       RETURNING *`,
      [userId, committee.id]
    );

    // Notify Organizer
    const orgRes = await query(`SELECT user_id FROM organizers WHERE committee_id = $1`, [committee.id]);
    if (orgRes.rows.length > 0) {
      const orgUserId = orgRes.rows[0].user_id;
      await createNotification(
        orgUserId,
        'join_request',
        'in_app',
        `A new participant requested to join your committee "${committee.name}".`,
        committee.id
      );
    }

    return res.status(200).json({
      message: 'Join request submitted successfully. Waiting for organizer approval!',
      committee,
      member: memberRes.rows[0],
    });
  } catch (error) {
    console.error('Error joining committee by code:', error);
    return res.status(500).json({ error: 'Failed to join committee.' });
  }
}

export async function getJoinRequests(req, res) {
  try {
    const userId = req.user?.userId;
    const { id: committeeId } = req.params;

    if (!(await isManagementUser(committeeId, userId))) {
      return res.status(403).json({ error: 'Only the organizer or co-organizer can view join requests.' });
    }

    const membersRes = await query(
      `SELECT m.id, u.full_name, u.profile_photo_url, u.cnic_status, ts.score
       FROM members m
       JOIN users u ON u.id = m.user_id
       LEFT JOIN trust_scores ts ON ts.user_id = u.id
       WHERE m.committee_id = $1 AND m.status = 'pending'`,
      [committeeId]
    );

    return res.status(200).json({ requests: membersRes.rows });
  } catch (error) {
    console.error('Error fetching join requests:', error);
    return res.status(500).json({ error: 'Failed to fetch join requests.' });
  }
}

/**
 * PATCH /api/committees/:id/requests/:memberId
 * Organizer approves or rejects a member's join request
 */
export async function updateMemberRequestStatus(req, res) {
  try {
    const userId = req.user?.userId;
    const { id: committeeId, memberId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be approved or rejected.' });
    }

    // Verify user is organizer or co-organizer of this committee
    if (!(await isManagementUser(committeeId, userId))) {
      return res.status(403).json({ error: 'Only the organizer or co-organizer can approve or reject join requests.' });
    }

    let payoutTurnOrder = null;
    if (status === 'approved') {
      const countRes = await query(
        `SELECT COUNT(*) FROM members WHERE committee_id = $1 AND status = 'approved'`,
        [committeeId]
      );
      payoutTurnOrder = parseInt(countRes.rows[0].count, 10) + 1;
    }

    const updateRes = await query(
      `UPDATE members 
       SET status = $1, payout_turn_order = COALESCE($2, payout_turn_order)
       WHERE id = $3 AND committee_id = $4
       RETURNING *`,
      [status, payoutTurnOrder, memberId, committeeId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Member request not found.' });
    }

    const updatedMember = updateRes.rows[0];

    // Fetch committee name for notification
    const commRes = await query(`SELECT name FROM committees WHERE id = $1`, [committeeId]);
    const commName = commRes.rows[0]?.name || 'Committee';

    // Notify Member of Approval / Rejection
    await createNotification(
      updatedMember.user_id,
      status === 'approved' ? 'join_approved' : 'join_rejected',
      'in_app',
      status === 'approved'
        ? `Your request to join "${commName}" has been approved by the organizer! 🎉`
        : `Your request to join "${commName}" was declined by the organizer.`,
      committeeId
    );

    return res.status(200).json({
      message: `Member request successfully ${status}!`,
      member: updatedMember,
    });
  } catch (error) {
    console.error('Error updating member request status:', error);
    return res.status(500).json({ error: 'Failed to update member status.' });
  }
}

/**
 * POST /api/committees/:id/members/add
 * Organizer adds a participant directly by User ID, phone number, or email
 */
export async function addMemberDirectly(req, res) {
  try {
    const userId = req.user?.userId;
    const { id: committeeId } = req.params;
    const { identifier } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'User ID, phone number, or email is required.' });
    }

    const cleanInput = identifier.trim().replace(/^@/, '');

    // 1. Verify user is organizer or co-organizer of this committee
    if (!(await isManagementUser(committeeId, userId))) {
      return res.status(403).json({ error: 'Only the organizer or co-organizer can add members directly.' });
    }

    const commRes = await query(`SELECT name, capacity FROM committees WHERE id = $1`, [committeeId]);
    if (commRes.rows.length === 0) {
      return res.status(404).json({ error: 'Committee not found.' });
    }
    const committee = commRes.rows[0];

    // 2. Find target user by UUID, phone, email, or name
    let userRes;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanInput);
    if (isUuid) {
      userRes = await query(
        `SELECT id, full_name, email, phone_number, profile_photo_url FROM users WHERE id = $1`,
        [cleanInput]
      );
    } else {
      userRes = await query(
        `SELECT id, full_name, email, phone_number, profile_photo_url 
         FROM users 
         WHERE phone_number = $1 OR email ILIKE $1 OR full_name ILIKE $1 
         LIMIT 1`,
        [cleanInput]
      );
    }

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: `User "${identifier}" not found. Make sure the user has registered on Sanjhi.` });
    }

    const targetUser = userRes.rows[0];

    // 3. Check if user is already a member
    const existingMemberRes = await query(
      `SELECT * FROM members WHERE committee_id = $1 AND user_id = $2`,
      [committeeId, targetUser.id]
    );

    if (existingMemberRes.rows.length > 0) {
      return res.status(400).json({ error: `${targetUser.full_name} is already a member (or has a pending request) of this committee.` });
    }

    // 4. Check committee capacity
    const countRes = await query(
      `SELECT COUNT(*) FROM members WHERE committee_id = $1 AND status = 'approved'`,
      [committeeId]
    );
    const approvedCount = parseInt(countRes.rows[0].count, 10);
    if (approvedCount >= committee.capacity) {
      return res.status(400).json({ error: `Committee capacity limit reached (${committee.capacity} members max).` });
    }

    const payoutTurnOrder = approvedCount + 1;

    // 5. Insert or Update member to approved
    const memberRes = await query(
      `INSERT INTO members (user_id, committee_id, status, payout_turn_order, joined_at)
       VALUES ($1, $2, 'approved', $3, NOW())
       ON CONFLICT (user_id, committee_id) 
       DO UPDATE SET status = 'approved', payout_turn_order = COALESCE(members.payout_turn_order, $3), joined_at = NOW()
       RETURNING *`,
      [targetUser.id, committeeId, payoutTurnOrder]
    );

    // 6. Notify user
    await createNotification(
      targetUser.id,
      'join_approved',
      'in_app',
      `You have been added to the committee "${committee.name}" by the organizer! 🎉`,
      committeeId
    );

    // Fetch trust score
    const tsRes = await query(`SELECT score FROM trust_scores WHERE user_id = $1`, [targetUser.id]);
    const trustScore = tsRes.rows.length > 0 ? parseFloat(tsRes.rows[0].score) : 850;

    return res.status(200).json({
      message: `${targetUser.full_name} added to committee successfully!`,
      member: {
        ...memberRes.rows[0],
        full_name: targetUser.full_name,
        name: targetUser.full_name,
        email: targetUser.email,
        phone_number: targetUser.phone_number,
        phone: targetUser.phone_number,
        profile_photo_url: targetUser.profile_photo_url,
        trust_score: trustScore,
      },
    });
  } catch (error) {
    console.error('Error adding member directly:', error);
    return res.status(500).json({ error: error.message || 'Failed to add member.' });
  }
}

/**
 * GET /api/committees/:id/members/search-users?q=...
 * Search registered users by name/phone/email to invite
 */
export async function searchUsers(req, res) {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(200).json({ users: [] });
    }

    const term = `%${q.trim()}%`;
    const usersRes = await query(
      `SELECT u.id, u.full_name, u.email, u.phone_number, u.profile_photo_url,
              COALESCE(ts.score, 850) AS trust_score
       FROM users u
       LEFT JOIN trust_scores ts ON ts.user_id = u.id
       WHERE u.full_name ILIKE $1 OR u.phone_number ILIKE $1 OR u.email ILIKE $1
       LIMIT 10`,
      [term]
    );

    return res.status(200).json({ users: usersRes.rows });
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({ error: 'Failed to search users.' });
  }
}

/**
 * PATCH /api/committees/:id
 * Update committee settings (name, contribution amount, capacity, interval)
 */
export async function updateCommittee(req, res) {
  try {
    const userId = req.user?.userId;
    const { id: committeeId } = req.params;
    const {
      name,
      contribution_amount, contributionAmount,
      capacity,
      interval_type, intervalType,
    } = req.body;

    if (!(await isManagementUser(committeeId, userId))) {
      return res.status(403).json({ error: 'Only the organizer or co-organizer can update committee settings.' });
    }

    const updates = {};
    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (!cleanName) return res.status(400).json({ error: 'Committee name cannot be empty.' });
      updates.name = cleanName;
    }
    if (contribution_amount !== undefined || contributionAmount !== undefined) {
      const amount = parseFloat(contribution_amount ?? contributionAmount);
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Contribution amount must be greater than 0.' });
      }
      updates.contribution_amount = amount;
    }
    if (capacity !== undefined) {
      const cap = parseInt(capacity, 10);
      if (!cap || cap <= 1) {
        return res.status(400).json({ error: 'Member capacity must be greater than 1.' });
      }
      const countRes = await query(
        `SELECT COUNT(*) FROM members WHERE committee_id = $1 AND status = 'approved'`,
        [committeeId]
      );
      const approvedCount = parseInt(countRes.rows[0].count, 10);
      if (cap < approvedCount) {
        return res.status(400).json({ error: `Capacity cannot be lower than the current approved member count (${approvedCount}).` });
      }
      updates.capacity = cap;
      updates.duration_cycles = cap;
    }
    if (interval_type !== undefined || intervalType !== undefined) {
      updates.interval_type = normalizeIntervalType(interval_type ?? intervalType);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    const setClause = Object.keys(updates).map((col, i) => `${col} = $${i + 1}`).join(', ');
    const values = Object.values(updates);
    const updateRes = await query(
      `UPDATE committees SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`,
      [...values, committeeId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Committee not found.' });
    }

    return res.status(200).json({ message: 'Committee settings updated successfully!', committee: updateRes.rows[0] });
  } catch (error) {
    console.error('Error updating committee:', error);
    return res.status(500).json({ error: 'Failed to update committee settings.' });
  }
}

/**
 * PATCH /api/committees/:id/status
 * Freeze, close, or reactivate a committee
 */
export async function updateCommitteeStatus(req, res) {
  try {
    const userId = req.user?.userId;
    const { id: committeeId } = req.params;
    const { status } = req.body;

    if (!['active', 'frozen', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be active, frozen, or closed.' });
    }

    if (!(await isManagementUser(committeeId, userId))) {
      return res.status(403).json({ error: 'Only the organizer or co-organizer can update the committee status.' });
    }

    const updateRes = await query(
      `UPDATE committees SET status = $1 WHERE id = $2 RETURNING *`,
      [status, committeeId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Committee not found.' });
    }

    // Trust Score: completion events for all approved members
    if (status === 'closed') {
      onCommitteeClosed(committeeId);
    }

    return res.status(200).json({ message: `Committee status set to ${status}.`, committee: updateRes.rows[0] });
  } catch (error) {
    console.error('Error updating committee status:', error);
    return res.status(500).json({ error: 'Failed to update committee status.' });
  }
}

/**
 * GET /api/committees/:id/collection-account
 */
export async function getCollectionAccount(req, res) {
  try {
    const { id: committeeId } = req.params;
    const accountRes = await query(
      `SELECT * FROM collection_accounts WHERE committee_id = $1 AND is_active = true`,
      [committeeId]
    );
    if (accountRes.rows.length === 0) {
      return res.status(404).json({ error: 'No active collection account linked to this committee.' });
    }
    return res.status(200).json({ account: accountRes.rows[0] });
  } catch (error) {
    console.error('Error fetching collection account:', error);
    return res.status(500).json({ error: 'Failed to fetch collection account.' });
  }
}

/**
 * POST /api/committees/:id/collection-account
 * Link or update the committee's active collection account
 */
export async function upsertCollectionAccount(req, res) {
  try {
    const userId = req.user?.userId;
    const { id: committeeId } = req.params;
    const {
      account_type, accountType, provider,
      account_number, accountNumber,
      account_title, accountTitle,
    } = req.body;

    const normType = normalizeAccountType(account_type || accountType || provider);
    const accNumber = String(account_number || accountNumber || '').trim();
    const accTitle = String(account_title || accountTitle || '').trim();

    if (!accNumber) return res.status(400).json({ error: 'Account number is required.' });
    if (!accTitle) return res.status(400).json({ error: 'Account title is required.' });

    if (!(await isManagementUser(committeeId, userId))) {
      return res.status(403).json({ error: 'Only the organizer or co-organizer can update the collection account.' });
    }

    const accountRes = await query(
      `INSERT INTO collection_accounts (committee_id, account_type, account_number, account_title, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (committee_id) WHERE is_active
       DO UPDATE SET
         account_type = EXCLUDED.account_type,
         account_number = EXCLUDED.account_number,
         account_title = EXCLUDED.account_title
       RETURNING *`,
      [committeeId, normType, accNumber, accTitle]
    );

    return res.status(200).json({ message: 'Collection account saved!', account: accountRes.rows[0] });
  } catch (error) {
    console.error('Error saving collection account:', error);
    return res.status(500).json({ error: 'Failed to save collection account.' });
  }
}

/**
 * POST /api/committees/:id/invite/regenerate
 */
export async function regenerateInviteCode(req, res) {
  try {
    const userId = req.user?.userId;
    const { id: committeeId } = req.params;

    if (!(await isManagementUser(committeeId, userId))) {
      return res.status(403).json({ error: 'Only the organizer or co-organizer can regenerate the invite code.' });
    }

    let inviteCode = generateInviteCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const clashRes = await query(`SELECT 1 FROM committees WHERE invite_code = $1`, [inviteCode]);
      if (clashRes.rows.length === 0) break;
      inviteCode = generateInviteCode();
    }

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/join/${inviteCode}`;

    const updateRes = await query(
      `UPDATE committees SET invite_code = $1, invite_link = $2 WHERE id = $3 RETURNING invite_code, invite_link`,
      [inviteCode, inviteLink, committeeId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Committee not found.' });
    }

    return res.status(200).json({ message: 'New invite code generated!', ...updateRes.rows[0] });
  } catch (error) {
    console.error('Error regenerating invite code:', error);
    return res.status(500).json({ error: 'Failed to regenerate invite code.' });
  }
}

/**
 * POST /api/committees/:id/co-organizers
 * Promote an approved member to co-organizer
 */
export async function promoteCoOrganizer(req, res) {
  try {
    const userId = req.user?.userId;
    const { id: committeeId } = req.params;
    const { member_id, memberId } = req.body;
    const targetMemberId = member_id || memberId;

    if (!targetMemberId) {
      return res.status(400).json({ error: 'member_id is required.' });
    }

    if (!(await isManagementUser(committeeId, userId))) {
      return res.status(403).json({ error: 'Only the organizer or co-organizer can promote members.' });
    }

    const memberRes = await query(
      `SELECT m.id, m.user_id, m.status, u.full_name
       FROM members m JOIN users u ON u.id = m.user_id
       WHERE m.id = $1 AND m.committee_id = $2`,
      [targetMemberId, committeeId]
    );

    if (memberRes.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found in this committee.' });
    }

    const member = memberRes.rows[0];

    if (member.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved members can be promoted to co-organizer.' });
    }

    const orgRes = await query(`SELECT user_id FROM organizers WHERE committee_id = $1`, [committeeId]);
    if (orgRes.rows[0]?.user_id === member.user_id) {
      return res.status(400).json({ error: 'The organizer already holds full management rights.' });
    }

    const coRes = await query(
      `INSERT INTO co_organizers (user_id, committee_id, promoted_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, committee_id)
       DO UPDATE SET demoted_at = NULL, promoted_by = EXCLUDED.promoted_by
       RETURNING *`,
      [member.user_id, committeeId, userId]
    );

    return res.status(200).json({
      message: `${member.full_name} promoted to Co-Organizer!`,
      coOrganizer: coRes.rows[0],
    });
  } catch (error) {
    console.error('Error promoting co-organizer:', error);
    return res.status(500).json({ error: 'Failed to promote co-organizer.' });
  }
}

/**
 * DELETE /api/committees/:id/co-organizers/:coOrganizerId
 */
export async function demoteCoOrganizer(req, res) {
  try {
    const userId = req.user?.userId;
    const { id: committeeId, coOrganizerId } = req.params;

    if (!(await isManagementUser(committeeId, userId))) {
      return res.status(403).json({ error: 'Only the organizer or co-organizer can demote co-organizers.' });
    }

    const coRes = await query(
      `UPDATE co_organizers SET demoted_at = NOW()
       WHERE id = $1 AND committee_id = $2 AND demoted_at IS NULL
       RETURNING *`,
      [coOrganizerId, committeeId]
    );

    if (coRes.rows.length === 0) {
      return res.status(404).json({ error: 'Active co-organizer not found in this committee.' });
    }

    return res.status(200).json({ message: 'Co-organizer demoted back to member.', coOrganizer: coRes.rows[0] });
  } catch (error) {
    console.error('Error demoting co-organizer:', error);
    return res.status(500).json({ error: 'Failed to demote co-organizer.' });
  }
}

/**
 * POST /api/committees/:id/cycles/:cycleId/payments
 * Participant submits a payment confirmation after transferring externally
 */
export async function submitPayment(req, res) {
  try {
    const userId = req.user?.userId;
    const { id: committeeId, cycleId } = req.params;
    const { sender_account_details, senderAccountDetails, transaction_id, transactionId } = req.body;

    const senderDetails = String(sender_account_details || senderAccountDetails || '').trim();
    const txnRef = String(transaction_id || transactionId || '').trim();
    const fullDetails = [senderDetails, txnRef ? `Ref: ${txnRef}` : ''].filter(Boolean).join(' • ');

    if (!fullDetails) {
      return res.status(400).json({ error: 'Sender account or transaction reference is required.' });
    }

    const cycleRes = await query(
      `SELECT cy.*, c.name AS committee_name
       FROM cycles cy
       JOIN committees c ON c.id = cy.committee_id
       WHERE cy.id = $1 AND cy.committee_id = $2`,
      [cycleId, committeeId]
    );

    if (cycleRes.rows.length === 0) {
      return res.status(404).json({ error: 'Cycle not found for this committee.' });
    }

    const cycle = cycleRes.rows[0];

    const memberRes = await query(
      `SELECT id FROM members WHERE committee_id = $1 AND user_id = $2 AND status = 'approved'`,
      [committeeId, userId]
    );

    const orgRes = await query(
      `SELECT user_id FROM organizers WHERE committee_id = $1 AND user_id = $2`,
      [committeeId, userId]
    );

    if (memberRes.rows.length === 0 && orgRes.rows.length === 0) {
      return res.status(403).json({ error: 'Only committee participants can submit payments.' });
    }

    const paymentRes = await query(
      `INSERT INTO payments (cycle_id, user_id, status, sender_account_details, submitted_at)
       VALUES ($1, $2, 'awaiting_confirmation', $3, NOW())
       ON CONFLICT (cycle_id, user_id) DO UPDATE SET
         sender_account_details = EXCLUDED.sender_account_details,
         submitted_at = NOW(),
         status = 'awaiting_confirmation',
         confirmed_by = NULL,
         confirmed_at = NULL
       RETURNING *`,
      [cycleId, userId, fullDetails]
    );

    // Notify the organizer a payment is awaiting verification
    const orgUserIdRes = await query(`SELECT user_id FROM organizers WHERE committee_id = $1`, [committeeId]);
    if (orgUserIdRes.rows.length > 0) {
      await createNotification(
        orgUserIdRes.rows[0].user_id,
        'payment_received',
        'in_app',
        `A payment for Cycle ${cycle.cycle_number} of "${cycle.committee_name}" is awaiting your verification.`,
        committeeId
      );
    }

    return res.status(200).json({
      message: 'Payment submitted! Waiting for organizer verification.',
      payment: paymentRes.rows[0],
    });
  } catch (error) {
    console.error('Error submitting payment:', error);
    return res.status(500).json({ error: 'Failed to submit payment.' });
  }
}

/**
 * GET /api/committees/:id/cycles/:cycleId/payments
 * Payment ledger for a cycle — visible to all committee participants
 */
export async function getCyclePayments(req, res) {
  try {
    const userId = req.user?.userId;
    const { id: committeeId, cycleId } = req.params;

    const role = await getMyRole(committeeId, userId);
    const isParticipant = role === 'organizer' || role === 'co_organizer' || role === 'member';
    if (!isParticipant) {
      return res.status(403).json({ error: 'Only committee participants can view the payment ledger.' });
    }

    const paymentsRes = await query(
      `SELECT p.*, u.full_name, u.profile_photo_url
       FROM payments p
       JOIN users u ON u.id = p.user_id
       WHERE p.cycle_id = $1`,
      [cycleId]
    );

    return res.status(200).json({ payments: paymentsRes.rows });
  } catch (error) {
    console.error('Error fetching cycle payments:', error);
    return res.status(500).json({ error: 'Failed to fetch payments.' });
  }
}

/**
 * PATCH /api/committees/:id/cycles/:cycleId/payments/:paymentId/confirm
 * Organizer / co-organizer verifies a participant's submitted payment
 */
export async function confirmPayment(req, res) {
  try {
    const userId = req.user?.userId;
    const { id: committeeId, cycleId, paymentId } = req.params;

    if (!(await isManagementUser(committeeId, userId))) {
      return res.status(403).json({ error: 'Only the organizer or co-organizer can verify payments.' });
    }

    const paymentRes = await query(
      `UPDATE payments SET status = 'paid', confirmed_by = $1, confirmed_at = NOW()
       WHERE id = $2 AND cycle_id = $3
       RETURNING *`,
      [userId, paymentId, cycleId]
    );

    if (paymentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found for this cycle.' });
    }

    const payment = paymentRes.rows[0];

    const cycleRes = await query(
      `SELECT cy.cycle_number, c.name AS committee_name
       FROM cycles cy JOIN committees c ON c.id = cy.committee_id
       WHERE cy.id = $1`,
      [cycleId]
    );

    if (cycleRes.rows.length > 0) {
      const { cycle_number, committee_name } = cycleRes.rows[0];
      await createNotification(
        payment.user_id,
        'payment_received',
        'in_app',
        `Your payment for Cycle ${cycle_number} of "${committee_name}" has been verified by the organizer ✓`,
        committeeId
      );

      // Check if all members have paid for this cycle
      const unpaidCheck = await query(
        `SELECT COUNT(*)::int AS unpaid_count
         FROM members m
         WHERE m.committee_id = $1 AND m.status = 'approved'
           AND NOT EXISTS (
             SELECT 1 FROM payments p
             WHERE p.cycle_id = $2 AND p.user_id = m.user_id AND p.status = 'paid'
           )`,
        [committeeId, cycleId]
      );

      if (parseInt(unpaidCheck.rows[0].unpaid_count, 10) === 0) {
        const allMembersRes = await query(
          `SELECT user_id FROM members WHERE committee_id = $1 AND status = 'approved'`,
          [committeeId]
        );
        for (const mRow of allMembersRes.rows) {
          await createNotification(
            mRow.user_id,
            'cycle_completed',
            'in_app',
            `🎉 All members have paid for Cycle ${cycle_number} of "${committee_name}"! Payout is ready to be released.`,
            committeeId
          );
        }
      }
    }

    // Trust Score: record on-time/late payment event (idempotent)
    onPaymentConfirmed(payment, committeeId);

    return res.status(200).json({ message: 'Payment verified!', payment });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({ error: 'Failed to verify payment.' });
  }
}

/**
 * POST /api/committees/:id/cycles/:cycleId/payout/release
 * Organizer / co-organizer releases the pool payout for a completed cycle
 */
export async function releasePayout(req, res) {
  try {
    const userId = req.user?.userId;
    const { id: committeeId, cycleId } = req.params;

    if (!(await isManagementUser(committeeId, userId))) {
      return res.status(403).json({ error: 'Only the organizer or co-organizer can release payouts.' });
    }

    const cycleRes = await query(
      `SELECT cy.*, c.name AS committee_name, c.contribution_amount, c.capacity
       FROM cycles cy
       JOIN committees c ON c.id = cy.committee_id
       WHERE cy.id = $1 AND cy.committee_id = $2`,
      [cycleId, committeeId]
    );

    if (cycleRes.rows.length === 0) {
      return res.status(404).json({ error: 'Cycle not found for this committee.' });
    }

    const cycle = cycleRes.rows[0];

    if (cycle.payout_status === 'sent' || cycle.payout_status === 'confirmed') {
      return res.status(400).json({ error: 'Payout for this cycle has already been released.' });
    }

    const unpaidRes = await query(
      `SELECT u.full_name
       FROM members m
       JOIN users u ON u.id = m.user_id
       WHERE m.committee_id = $1 AND m.status = 'approved'
         AND NOT EXISTS (
           SELECT 1 FROM payments p
           WHERE p.cycle_id = $2 AND p.user_id = m.user_id AND p.status = 'paid'
         )`,
      [committeeId, cycleId]
    );

    if (unpaidRes.rows.length > 0) {
      return res.status(400).json({
        error: `Cannot release: ${unpaidRes.rows.length} member(s) still unpaid (${unpaidRes.rows.map((r) => r.full_name).join(', ')}).`,
      });
    }

    const updateRes = await query(
      `UPDATE cycles
       SET payout_status = 'sent', payout_sent_at = NOW(), status = 'closed'
       WHERE id = $1
       RETURNING *`,
      [cycleId]
    );

    // Trust Score: flag any participant who closed the cycle unpaid
    onCycleClosed(cycleId, committeeId);

    // Rotate: assign the next member in payout order to the next collecting cycle
    const nextCycleRes = await query(
      `SELECT id FROM cycles
       WHERE committee_id = $1 AND status = 'collecting' AND cycle_number > $2
       ORDER BY cycle_number ASC LIMIT 1`,
      [committeeId, cycle.cycle_number]
    );

    if (nextCycleRes.rows.length > 0 && cycle.recipient_user_id) {
      const currentOrderRes = await query(
        `SELECT payout_turn_order FROM members WHERE committee_id = $1 AND user_id = $2`,
        [committeeId, cycle.recipient_user_id]
      );
      const currentOrder = currentOrderRes.rows[0]?.payout_turn_order;

      if (currentOrder) {
        const nextRecipientRes = await query(
          `SELECT user_id FROM members
           WHERE committee_id = $1 AND status = 'approved' AND payout_turn_order > $2
           ORDER BY payout_turn_order ASC LIMIT 1`,
          [committeeId, currentOrder]
        );
        if (nextRecipientRes.rows.length > 0) {
          await query(
            `UPDATE cycles SET recipient_user_id = $1 WHERE id = $2`,
            [nextRecipientRes.rows[0].user_id, nextCycleRes.rows[0].id]
          );
        }
      }
    }

    if (cycle.recipient_user_id) {
      const poolAmount = parseFloat(cycle.contribution_amount) * cycle.capacity;
      await createNotification(
        cycle.recipient_user_id,
        'payout_released',
        'in_app',
        `The payout of Rs. ${poolAmount.toLocaleString('en-PK')} for Cycle ${cycle.cycle_number} of "${cycle.committee_name}" has been sent by the organizer! 🎉`,
        committeeId
      );
    }

    return res.status(200).json({
      message: 'Payout released successfully!',
      cycle: updateRes.rows[0],
    });
  } catch (error) {
    console.error('Error releasing payout:', error);
    return res.status(500).json({ error: 'Failed to release payout.' });
  }
}

/**
 * DELETE /api/committees/:id/members/:memberId
 * Remove a member from the committee (soft delete via status).
 * A member may also remove themselves (leave committee).
 */
export async function removeMember(req, res) {
  try {
    const userId = req.user?.userId;
    const { id: committeeId, memberId } = req.params;

    const memberRes = await query(
      `SELECT m.id, m.user_id, m.status, u.full_name
       FROM members m JOIN users u ON u.id = m.user_id
       WHERE m.id = $1 AND m.committee_id = $2`,
      [memberId, committeeId]
    );

    if (memberRes.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found in this committee.' });
    }

    const member = memberRes.rows[0];

    const isSelf = member.user_id === userId;
    if (!isSelf && !(await isManagementUser(committeeId, userId))) {
      return res.status(403).json({ error: 'Only the organizer or co-organizer can remove members.' });
    }

    const orgRes = await query(`SELECT user_id FROM organizers WHERE committee_id = $1`, [committeeId]);
    if (orgRes.rows[0]?.user_id === member.user_id) {
      return res.status(400).json({ error: 'The organizer cannot be removed from their own committee.' });
    }

    // If the member is an active co-organizer, demote them first
    await query(
      `UPDATE co_organizers SET demoted_at = NOW()
       WHERE committee_id = $1 AND user_id = $2 AND demoted_at IS NULL`,
      [committeeId, member.user_id]
    );

    const updateRes = await query(
      `UPDATE members SET status = 'removed', payout_turn_order = NULL
       WHERE id = $1 AND committee_id = $2
       RETURNING *`,
      [memberId, committeeId]
    );

    // Trust Score: dropout event only if the member had missed payments
    onMemberRemoved(member.user_id, committeeId);

    return res.status(200).json({
      message: isSelf ? 'You have left the committee.' : `${member.full_name} removed from the committee.`,
      member: updateRes.rows[0],
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return res.status(500).json({ error: 'Failed to remove member.' });
  }
}

// ─── PUBLIC COMMITTEE MARKETPLACE ───────────────────────────────

async function hasActiveCoOrganizers(committeeId) {
  const res = await query(
    `SELECT 1 FROM co_organizers WHERE committee_id = $1 AND demoted_at IS NULL LIMIT 1`,
    [committeeId]
  );
  return res.rows.length > 0;
}

async function isOrganizer(committeeId, userId) {
  const res = await query(
    `SELECT 1 FROM organizers WHERE committee_id = $1 AND user_id = $2`,
    [committeeId, userId]
  );
  return res.rows.length > 0;
}

export async function getPublicCommittees(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { category, search } = req.query;
    const cacheKey = `sanjhi:cache:public_committees:${userId}:${category || 'all'}:${search || 'none'}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const params = [userId];
    let sql = `
      SELECT c.*,
        u.full_name AS organizer_name,
        u.cnic_status AS organizer_cnic_status,
        (SELECT COUNT(*)::int FROM members m2 WHERE m2.committee_id = c.id AND m2.status = 'approved') AS member_count
      FROM committees c
      LEFT JOIN users u ON u.id = c.created_by
      WHERE c.is_public = true AND c.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM organizers o WHERE o.committee_id = c.id AND o.user_id = $1
        )
        AND NOT EXISTS (
          SELECT 1 FROM members m WHERE m.committee_id = c.id AND m.user_id = $1
        )
        AND NOT EXISTS (
          SELECT 1 FROM co_organizers co WHERE co.committee_id = c.id AND co.user_id = $1 AND co.demoted_at IS NULL
        )
    `;

    if (category) {
      params.push(category);
      sql += ` AND c.category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      sql += ` AND (LOWER(c.name) LIKE $${params.length} OR LOWER(c.description) LIKE $${params.length} OR LOWER(c.category) LIKE $${params.length})`;
    }

    sql += ` ORDER BY c.created_at DESC LIMIT 100`;

    const result = await query(sql, params);
    const responsePayload = { committees: result.rows };

    // Cache for 60 seconds
    await setCache(cacheKey, responsePayload, 60);

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error('Error fetching public committees:', error);
    return res.status(500).json({ error: 'Failed to fetch public committees.' });
  }
}

export async function requestPublicToggle(req, res) {
  try {
    const userId = req.user?.userId;
    const { id: committeeId } = req.params;

    if (!(await isOrganizer(committeeId, userId))) {
      return res.status(403).json({ error: 'Only the organizer can request a public/private toggle.' });
    }

    const commRes = await query(
      `SELECT is_public FROM committees WHERE id = $1`,
      [committeeId]
    );
    if (commRes.rows.length === 0) {
      return res.status(404).json({ error: 'Committee not found.' });
    }

    const committee = commRes.rows[0];
    const hasCoOrgs = await hasActiveCoOrganizers(committeeId);

    if (!hasCoOrgs) {
      // No co-organizer: toggle immediately
      const newValue = !committee.is_public;
      const result = await query(
        `UPDATE committees
         SET is_public = $1,
             public_toggle_requested_by = NULL,
             public_toggle_approved_by = NULL,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [newValue, committeeId]
      );

      // Invalidate marketplace cache
      delCachePattern('sanjhi:cache:public_committees:*').catch(() => {});

      return res.status(200).json({
        message: `Committee is now ${newValue ? 'public' : 'private'}.`,
        committee: result.rows[0],
      });
    }

    // Co-organizers exist: create a pending toggle request
    const result = await query(
      `UPDATE committees
       SET public_toggle_requested_by = $1,
           public_toggle_approved_by = NULL,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [userId, committeeId]
    );

    // Notify co-organizers
    const coOrgsRes = await query(
      `SELECT user_id FROM co_organizers WHERE committee_id = $1 AND demoted_at IS NULL`,
      [committeeId]
    );
    for (const co of coOrgsRes.rows) {
      await createNotification(
        co.user_id,
        'public_toggle_request',
        'in_app',
        `The organizer requested to make the committee "${committee.name}" ${committee.is_public ? 'private' : 'public'}. Please review.`,
        committeeId
      );
    }

    return res.status(200).json({
      message: 'Public/private toggle request sent to co-organizers for approval.',
      committee: result.rows[0],
    });
  } catch (error) {
    console.error('Error requesting public toggle:', error);
    return res.status(500).json({ error: 'Failed to request public toggle.' });
  }
}

export async function approvePublicToggle(req, res) {
  try {
    const userId = req.user?.userId;
    const { id: committeeId } = req.params;

    const role = await getMyRole(committeeId, userId);
    if (role !== 'organizer' && role !== 'co_organizer') {
      return res.status(403).json({ error: 'Only management can approve a public toggle request.' });
    }

    const commRes = await query(
      `SELECT is_public, public_toggle_requested_by, name FROM committees WHERE id = $1`,
      [committeeId]
    );
    if (commRes.rows.length === 0) {
      return res.status(404).json({ error: 'Committee not found.' });
    }

    const committee = commRes.rows[0];
    if (!committee.public_toggle_requested_by) {
      return res.status(400).json({ error: 'No pending public toggle request.' });
    }
    if (committee.public_toggle_requested_by === userId) {
      return res.status(400).json({ error: 'You cannot approve your own toggle request.' });
    }

    const newValue = !committee.is_public;
    const result = await query(
      `UPDATE committees
       SET is_public = $1,
           public_toggle_approved_by = $2,
           public_toggle_requested_by = NULL,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [newValue, userId, committeeId]
    );

    await createNotification(
      committee.public_toggle_requested_by,
      'public_toggle_approved',
      'in_app',
      `Your request to make "${committee.name}" ${newValue ? 'public' : 'private'} was approved.`,
      committeeId
    );

    return res.status(200).json({
      message: `Toggle approved. Committee is now ${newValue ? 'public' : 'private'}.`,
      committee: result.rows[0],
    });
  } catch (error) {
    console.error('Error approving public toggle:', error);
    return res.status(500).json({ error: 'Failed to approve public toggle.' });
  }
}
