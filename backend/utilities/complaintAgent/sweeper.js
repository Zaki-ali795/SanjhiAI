/**
 * sweeper.js — Periodic job that catches stuck/failed complaints and re-enqueues them.
 *
 * Runs every 2 minutes. Finds complaints that are:
 * - status = 'pending' AND created more than 3 minutes ago (agent never ran or crashed)
 * - status = 'needs_human_review' AND ai_summary contains 'failed after' (queue exhausted)
 *
 * Re-enqueues them into the complaint queue for another attempt.
 */

import { query } from '../../config/db.js';
import { getQueue } from './queue.js';

const SWEEP_INTERVAL_MS = 2 * 60 * 1000;  // Every 2 minutes
const STUCK_THRESHOLD_MINUTES = 3;         // Complaints pending > 3 min are considered stuck

let timer = null;

/**
 * Start the sweeper interval. Call once after queue is initialized.
 */
export function startSweeper() {
  if (timer) return; // Already running

  // Run immediately on start, then every interval
  sweep();
  timer = setInterval(sweep, SWEEP_INTERVAL_MS);
  console.log(`[Sweeper] Started — checking for stuck complaints every ${SWEEP_INTERVAL_MS / 1000}s.`);
}

/**
 * Stop the sweeper (for graceful shutdown).
 */
export function stopSweeper() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log('[Sweeper] Stopped.');
  }
}

/**
 * Perform a single sweep.
 */
async function sweep() {
  try {
    const result = await query(
      `SELECT id FROM complaints
       WHERE status = 'pending'
         AND created_at < NOW() - INTERVAL '1 minute' * $1
       ORDER BY created_at ASC
       LIMIT 10`,
      [STUCK_THRESHOLD_MINUTES]
    );

    if (result.rows.length === 0) return; // Nothing stuck

    const queue = getQueue();
    console.log(`[Sweeper] Found ${result.rows.length} stuck complaint(s). Re-enqueuing...`);

    for (const row of result.rows) {
      queue.enqueue(row.id);
    }
  } catch (err) {
    console.error('[Sweeper] Error during sweep:', err.message);
  }
}
