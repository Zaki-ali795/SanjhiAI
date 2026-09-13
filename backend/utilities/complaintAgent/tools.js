/**
 * tools.js — Database query tools for the Complaint Case-Builder Agent.
 *
 * Provides 4 tools that the Investigator agent uses to gather evidence:
 * 1. fetchComplaintDetails — full complaint record + parties' names
 * 2. fetchPaymentLedger — all payments for this committee (both parties)
 * 3. fetchTrustProfiles — trust_scores + risk_flags for both parties
 * 4. fetchCommitteeContext — committee details, member count, interval
 */

import { query } from '../../config/db.js';

/**
 * Tool 1: Fetch full complaint details with party names and committee name.
 * @param {string} complaintId - UUID of the complaint
 * @returns {Promise<object|null>} complaint record with joined data
 */
export async function fetchComplaintDetails(complaintId) {
  try {
    const res = await query(
      `SELECT cmp.*,
        u1.full_name AS complainant_name, u1.email AS complainant_email, u1.phone_number AS complainant_phone,
        u2.full_name AS accused_name, u2.email AS accused_email, u2.phone_number AS accused_phone,
        c.name AS committee_name
       FROM complaints cmp
       LEFT JOIN users u1 ON u1.id = cmp.filed_by
       LEFT JOIN users u2 ON u2.id = cmp.accused_user_id
       LEFT JOIN committees c ON c.id = cmp.committee_id
       WHERE cmp.id = $1`,
      [complaintId]
    );
    return res.rows[0] || null;
  } catch (err) {
    console.error('Error fetching complaint details:', err.message);
    return null;
  }
}

/**
 * Tool 2: Fetch payment ledger for both parties in the committee.
 * @param {string} committeeId - UUID of the committee
 * @param {string} filedByUserId - UUID of the complainant
 * @param {string} accusedUserId - UUID of the accused (may be null)
 * @returns {Promise<Array>} array of payment records with cycle info
 */
export async function fetchPaymentLedger(committeeId, filedByUserId, accusedUserId) {
  try {
    const userIds = [filedByUserId];
    if (accusedUserId) userIds.push(accusedUserId);

    const res = await query(
      `SELECT p.*, cy.cycle_number, cy.due_date, c.name AS committee_name
       FROM payments p
       JOIN cycles cy ON cy.id = p.cycle_id
       JOIN committees c ON c.id = cy.committee_id
       WHERE cy.committee_id = $1
         AND p.user_id = ANY($2)
       ORDER BY p.submitted_at ASC`,
      [committeeId, userIds]
    );
    return res.rows;
  } catch (err) {
    console.error('Error fetching payment ledger:', err.message);
    return [];
  }
}

/**
 * Tool 3: Fetch trust profiles (trust scores + active risk flags) for both parties.
 * @param {string} userId1 - UUID of the complainant
 * @param {string} userId2 - UUID of the accused (may be null)
 * @returns {Promise<object>} object with trustScores and riskFlags arrays
 */
export async function fetchTrustProfiles(userId1, userId2) {
  const userIds = [userId1];
  if (userId2) userIds.push(userId2);

  try {
    // Fetch trust scores
    const scoresRes = await query(
      `SELECT user_id, score, on_time_rate, completed_committees_count, last_calculated_at
       FROM trust_scores
       WHERE user_id = ANY($1)`,
      [userIds]
    );

    // Fetch active risk flags (uncleared)
    const flagsRes = await query(
      `SELECT rf.*, cy.cycle_number, c.name AS committee_name
       FROM risk_flags rf
       JOIN cycles cy ON cy.id = rf.cycle_id
       JOIN committees c ON c.id = cy.committee_id
       WHERE rf.user_id = ANY($1)
         AND rf.cleared_at IS NULL
       ORDER BY rf.flagged_at DESC`,
      [userIds]
    );

    return {
      trustScores: scoresRes.rows,
      riskFlags: flagsRes.rows,
    };
  } catch (err) {
    console.error('Error fetching trust profiles:', err.message);
    return { trustScores: [], riskFlags: [] };
  }
}

/**
 * Tool 4: Fetch committee context (details, member count, cycle count).
 * @param {string} committeeId - UUID of the committee
 * @returns {Promise<object|null>} committee record with aggregated counts
 */
export async function fetchCommitteeContext(committeeId) {
  try {
    const res = await query(
      `SELECT c.*,
        (SELECT COUNT(*)::int FROM members WHERE committee_id = $1 AND status = 'approved') AS active_members,
        (SELECT COUNT(*)::int FROM cycles WHERE committee_id = $1) AS total_cycles
       FROM committees c
       WHERE c.id = $1`,
      [committeeId]
    );
    return res.rows[0] || null;
  } catch (err) {
    console.error('Error fetching committee context:', err.message);
    return null;
  }
}
