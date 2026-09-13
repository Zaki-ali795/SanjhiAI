/**
 * complaintController.js — User-facing complaint filing and case file retrieval.
 *
 * Provides endpoints for:
 * - POST /api/complaints — File a new complaint (triggers AI investigation)
 * - GET /api/complaints/my — Get user's own complaints
 * - GET /api/complaints/:id — Get specific complaint with case file
 */

import { query } from '../config/db.js';
import { getQueue } from '../utilities/complaintAgent/queue.js';

const MAX_DESCRIPTION_LENGTH = 3000; // Cost control per plan

/**
 * POST /api/complaints
 * File a new complaint. Triggers AI investigation asynchronously.
 */
export async function fileComplaint(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { accused_user_id, committee_id, category, description, evidence_url } = req.body;

    // Validation
    if (!category || !description) {
      return res.status(400).json({ error: 'Category and description are required.' });
    }

    if (accused_user_id && accused_user_id === userId) {
      return res.status(400).json({ error: 'You cannot report yourself.' });
    }

    if (accused_user_id) {
      const accCheck = await query(`SELECT id, full_name FROM users WHERE id = $1`, [accused_user_id]);
      if (accCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Reported user not found.' });
      }
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return res.status(400).json({
        error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less. Current length: ${description.length}`,
      });
    }

    const validCategories = ['payment_dispute', 'harassment', 'suspected_fraud', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
    }

    // Insert complaint
    const insertRes = await query(
      `INSERT INTO complaints (filed_by, accused_user_id, committee_id, category, description, evidence_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [userId, accused_user_id || null, committee_id || null, category, description, evidence_url || null]
    );

    const complaint = insertRes.rows[0];

    // Enqueue for AI investigation (queue handles concurrency + retries)
    try {
      getQueue().enqueue(complaint.id);
    } catch (queueErr) {
      console.error('[ComplaintController] Queue enqueue failed:', queueErr.message);
      // Complaint is still saved, sweeper will pick it up
    }

    return res.status(201).json({
      message: 'Complaint filed successfully. AI investigation in progress.',
      complaint: {
        id: complaint.id,
        status: complaint.status,
        created_at: complaint.created_at,
      },
    });
  } catch (err) {
    console.error('Error filing complaint:', err);
    return res.status(500).json({ error: 'Failed to file complaint.' });
  }
}

/**
 * GET /api/complaints/my
 * Get all complaints filed by the authenticated user.
 */
export async function getMyComplaints(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const result = await query(
      `SELECT cmp.*, c.name AS committee_name,
        u.full_name AS resolved_by_name
       FROM complaints cmp
       LEFT JOIN committees c ON c.id = cmp.committee_id
       LEFT JOIN users u ON u.id = cmp.resolved_by
       WHERE cmp.filed_by = $1
       ORDER BY cmp.created_at DESC`,
      [userId]
    );

    return res.status(200).json({ complaints: result.rows.map(r => {
      const { ai_case_file, ...rest } = r;
      return rest;
    }) });
  } catch (err) {
    console.error('Error fetching user complaints:', err);
    return res.status(500).json({ error: 'Failed to fetch complaints.' });
  }
}

/**
 * GET /api/complaints/:id
 * Get a specific complaint with its AI case file.
 */
export async function getComplaintById(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { id } = req.params;

    const result = await query(
      `SELECT cmp.*, c.name AS committee_name,
        u.full_name AS resolved_by_name
       FROM complaints cmp
       LEFT JOIN committees c ON c.id = cmp.committee_id
       LEFT JOIN users u ON u.id = cmp.resolved_by
       WHERE cmp.id = $1 AND (cmp.filed_by = $2 OR cmp.accused_user_id = $2)`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found or access denied.' });
    }

    const row = result.rows[0];
    const { ai_case_file, ...complaint } = row;
    return res.status(200).json({ complaint });
  } catch (err) {
    console.error('Error fetching complaint:', err);
    return res.status(500).json({ error: 'Failed to fetch complaint.' });
  }
}

/**
 * GET /api/complaints/search-users
 * Search users by name, email, or phone number to report.
 */
export async function searchReportableUsers(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(200).json({ users: [] });
    }

    const term = `%${q.trim().toLowerCase()}%`;
    const result = await query(
      `SELECT id, full_name, email, phone_number, profile_photo_url
       FROM users
       WHERE id != $1
         AND (LOWER(full_name) LIKE $2 OR LOWER(email) LIKE $2 OR phone_number LIKE $2)
       ORDER BY full_name ASC
       LIMIT 20`,
      [userId, term]
    );

    return res.status(200).json({ users: result.rows });
  } catch (err) {
    console.error('Error searching reportable users:', err);
    return res.status(500).json({ error: 'Failed to search users.' });
  }
}
