import { query } from '../config/db.js';

/**
 * GET /api/payments/my
 * Current user's payment history, upcoming dues, and stats across committees
 */
export async function getMyPayments(req, res) {
  try {
    const userId = req.user.userId;

    const historyRes = await query(
      `SELECT p.id, p.status, p.submitted_at, p.confirmed_at, p.sender_account_details,
              c.id AS committee_id, c.name AS committee_name,
              cy.id AS cycle_id, cy.cycle_number, cy.due_date, cy.payout_status
       FROM payments p
       JOIN cycles cy ON cy.id = p.cycle_id
       JOIN committees c ON c.id = cy.committee_id
       WHERE p.user_id = $1
       ORDER BY cy.due_date DESC, p.submitted_at DESC`,
      [userId]
    );

    const upcomingRes = await query(
      `SELECT c.id AS committee_id, c.name AS committee_name,
              c.contribution_amount, c.capacity,
              cy.id AS cycle_id, cy.cycle_number, cy.due_date,
              m.payout_turn_order
       FROM cycles cy
       JOIN committees c ON c.id = cy.committee_id
       JOIN members m ON m.committee_id = c.id AND m.user_id = $1 AND m.status = 'approved'
       WHERE cy.status = 'collecting'
         AND NOT EXISTS (
           SELECT 1 FROM payments p
           WHERE p.cycle_id = cy.id AND p.user_id = $1 AND p.status = 'paid'
         )
       ORDER BY cy.due_date ASC`,
      [userId]
    );

    const tsRes = await query(
      `SELECT score FROM trust_scores WHERE user_id = $1`,
      [userId]
    );
    const trustScore = tsRes.rows.length > 0 ? parseFloat(tsRes.rows[0].score) : null;

    const history = historyRes.rows;
    const confirmed = history.filter((p) => p.status === 'paid' && p.confirmed_at && p.due_date);
    const onTime = confirmed.filter((p) => new Date(p.confirmed_at) <= new Date(`${p.due_date}T23:59:59`));
    const onTimeRate = confirmed.length > 0 ? Math.round((onTime.length / confirmed.length) * 100) : null;

    return res.status(200).json({
      history,
      upcoming: upcomingRes.rows,
      stats: {
        trust_score: trustScore,
        total_paid: confirmed.length,
        on_time: onTime.length,
        on_time_rate: onTimeRate,
      },
    });
  } catch (error) {
    console.error('Error fetching my payments:', error);
    return res.status(500).json({ error: 'Failed to fetch payments.' });
  }
}
