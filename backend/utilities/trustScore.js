/**
 * trustScore.js — Community Trust Score engine (FR-TRUST-01).
 *
 * Event-sourced, time-decayed, Bayesian-smoothed reputation score.
 *
 *   Score = clamp(0, 1000, 250 + 550·R + 150·C + 50·V + P)
 *
 *   R (reliability): decayed on-time quality, half-life 90 days,
 *      Bayesian prior π0=0.9 with strength m=3 (cold-start protection)
 *   C (completion):  committee completion vs dropout, half-life 180 days
 *   V (verification): phone 0.3 + email 0.3 + CNIC 0.4 (static)
 *   P (penalties):   −120 per admin-resolved fraud/payment complaint,
 *      decayed (half-life 180 days), capped at −400
 *
 * New users score exactly 850. A perfect veteran scores 1000.
 *
 * All state lives in the append-only trust_score_events table, so the
 * score is deterministic and fully replayable. Hook helpers below never
 * throw — a scoring failure must never break a business operation.
 */

import { query } from '../config/db.js';

/* ── Model constants (tuned so: new user = 850, perfect = 1000) ── */
const BASE = 250;
const W_RELIABILITY = 550;
const W_COMPLETION = 150;
const W_VERIFICATION = 50;

const PRIOR_R = 0.9;   // prior belief: people are mostly reliable
const PRIOR_R_M = 3;   // prior strength (effective pseudo-observations)
const PRIOR_C = 0.6;   // chosen so a brand-new user scores exactly 850
const PRIOR_C_M = 1;

const PENALTY_PER_COMPLAINT = 120;
const PENALTY_CAP = 400;

const HALF_LIFE_PAYMENT_DAYS = 90;
const HALF_LIFE_COMPLETION_DAYS = 180;

const INTERVAL_DAYS = { '15_days': 15, '1_month': 30, '2_months': 60 };
const MS_PER_DAY = 86_400_000;

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const decayWeight = (daysAgo, halfLifeDays) => Math.pow(0.5, daysAgo / halfLifeDays);
const daysBetween = (a, b) => Math.max(0, (new Date(a) - new Date(b)) / MS_PER_DAY);

const PAYMENT_EVENTS = ['payment_on_time', 'payment_late', 'payment_missed'];
const COMPLETION_EVENTS = ['committee_completed', 'committee_dropout'];

/**
 * Pure scoring function — deterministic, unit-testable.
 * @param {Array<{event_type, value, half_life_days, occurred_at}>} events
 * @param {{ emailVerified?: boolean, cnicVerified?: boolean }} verification
 * @param {Date} [now]
 * @returns {{ score, components, reliabilityRate }}
 */
export function computeScore(events, verification = {}, now = new Date()) {
  // R — reliability (Bayesian-smoothed, decayed)
  let rNum = PRIOR_R_M * PRIOR_R;
  let rDen = PRIOR_R_M;
  for (const e of events) {
    if (!PAYMENT_EVENTS.includes(e.event_type)) continue;
    const w = decayWeight(daysBetween(now, e.occurred_at), e.half_life_days || HALF_LIFE_PAYMENT_DAYS);
    rNum += w * clamp(Number(e.value), 0, 1);
    rDen += w;
  }
  const R = rNum / rDen;

  // C — completion
  let cNum = PRIOR_C_M * PRIOR_C;
  let cDen = PRIOR_C_M;
  for (const e of events) {
    if (!COMPLETION_EVENTS.includes(e.event_type)) continue;
    const w = decayWeight(daysBetween(now, e.occurred_at), e.half_life_days || HALF_LIFE_COMPLETION_DAYS);
    cNum += w * clamp(Number(e.value), 0, 1);
    cDen += w;
  }
  const C = cNum / cDen;

  // V — verification (phone always true: signup is OTP-based)
  const V =
    0.3 + // phone verified via OTP signup
    0.3 * (verification.emailVerified ? 1 : 0) +
    0.4 * (verification.cnicVerified ? 1 : 0);

  // P — dispute penalties (decayed, capped)
  let P = 0;
  for (const e of events) {
    if (e.event_type !== 'complaint_penalty') continue;
    const w = decayWeight(daysBetween(now, e.occurred_at), e.half_life_days || HALF_LIFE_COMPLETION_DAYS);
    P -= PENALTY_PER_COMPLAINT * w;
  }
  P = clamp(P, -PENALTY_CAP, 0);

  const reliabilityPoints = Math.round(W_RELIABILITY * R);
  const completionPoints = Math.round(W_COMPLETION * C);
  const verificationPoints = Math.round(W_VERIFICATION * V);
  const penaltyPoints = Math.round(P);

  const score = clamp(
    Math.round(BASE + reliabilityPoints + completionPoints + verificationPoints + penaltyPoints),
    0,
    1000
  );

  return {
    score,
    reliabilityRate: R,
    components: {
      base: BASE,
      reliability: { points: reliabilityPoints, max: W_RELIABILITY, rate: Number(R.toFixed(4)) },
      completion: { points: completionPoints, max: W_COMPLETION, rate: Number(C.toFixed(4)) },
      verification: { points: verificationPoints, max: W_VERIFICATION, rate: Number(V.toFixed(2)) },
      penalties: { points: penaltyPoints, max: 0 },
    },
  };
}

/* ── Persistence ── */

/**
 * Idempotent event recording + recompute. Retries/repeats are safe.
 */
export async function recordEvent(userId, eventType, value, halfLifeDays, referenceId, detail = {}, occurredAt = null) {
  await query(
    `INSERT INTO trust_score_events (user_id, event_type, value, half_life_days, reference_id, detail, occurred_at)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, now()))
     ON CONFLICT (event_type, reference_id) DO NOTHING`,
    [userId, eventType, value, halfLifeDays, referenceId, JSON.stringify(detail), occurredAt]
  );
  await recomputeUser(userId);
}

/**
 * Recompute one user's score from their full event history and
 * upsert the cached trust_scores row.
 */
export async function recomputeUser(userId) {
  const eventsRes = await query(
    `SELECT event_type, value, half_life_days, occurred_at
     FROM trust_score_events WHERE user_id = $1`,
    [userId]
  );

  const userRes = await query(
    `SELECT email, cnic_status FROM users WHERE id = $1`,
    [userId]
  );
  const u = userRes.rows[0] || {};

  const result = computeScore(eventsRes.rows, {
    emailVerified: !!u.email,
    cnicVerified: u.cnic_status === 'verified',
  });

  const completedCount = eventsRes.rows.filter((e) => e.event_type === 'committee_completed').length;

  await query(
    `INSERT INTO trust_scores (user_id, score, on_time_rate, completed_committees_count, last_calculated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (user_id) DO UPDATE SET
       score = EXCLUDED.score,
       on_time_rate = EXCLUDED.on_time_rate,
       completed_committees_count = EXCLUDED.completed_committees_count,
       last_calculated_at = now()`,
    [userId, result.score, result.reliabilityRate, completedCount]
  );

  return result;
}

/* ── Event hook helpers (never throw — scoring must not break flows) ── */

function safe(label, fn) {
  return (...args) => Promise.resolve()
    .then(() => fn(...args))
    .catch((err) => console.error(`[TrustScore] ${label} failed:`, err.message));
}

/**
 * Organizer confirmed a payment → on_time / late event.
 */
export const onPaymentConfirmed = safe('onPaymentConfirmed', async (payment, committeeId) => {
  const infoRes = await query(
    `SELECT cy.due_date, cy.cycle_number, c.interval_type, c.name AS committee_name
     FROM cycles cy JOIN committees c ON c.id = cy.committee_id
     WHERE cy.id = $1`,
    [payment.cycle_id]
  );
  if (infoRes.rows.length === 0 || !payment.confirmed_at) return;

  const { due_date, cycle_number, interval_type, committee_name } = infoRes.rows[0];
  const intervalDays = INTERVAL_DAYS[interval_type] || 30;
  const daysLate = Math.floor((new Date(payment.confirmed_at) - new Date(due_date)) / MS_PER_DAY);

  const isLate = daysLate > 0;
  const value = isLate ? clamp(1 - daysLate / intervalDays, 0, 1) : 1;

  await recordEvent(
    payment.user_id,
    isLate ? 'payment_late' : 'payment_on_time',
    Number(value.toFixed(3)),
    HALF_LIFE_PAYMENT_DAYS,
    payment.id,
    { days_late: daysLate, interval_days: intervalDays, cycle_number, committee_name, committee_id: committeeId }
  );
});

/**
 * Cycle closed with payout released → any participant without a
 * confirmed payment gets a missed-payment event.
 */
export const onCycleClosed = safe('onCycleClosed', async (cycleId, committeeId) => {
  const unpaidRes = await query(
    `SELECT m.user_id, cy.cycle_number, c.name AS committee_name, c.interval_type
     FROM members m
     CROSS JOIN cycles cy
     JOIN committees c ON c.id = cy.committee_id
     WHERE cy.id = $1 AND c.id = $2
       AND m.committee_id = $2 AND m.status = 'approved'
       AND NOT EXISTS (
         SELECT 1 FROM payments p
         WHERE p.cycle_id = $1 AND p.user_id = m.user_id AND p.status = 'paid'
       )`,
    [cycleId, committeeId]
  );

  for (const row of unpaidRes.rows) {
    // Skip the payout recipient — they never pay their own cycle
    const cycleRes = await query(`SELECT recipient_user_id FROM cycles WHERE id = $1`, [cycleId]);
    if (cycleRes.rows[0]?.recipient_user_id === row.user_id) continue;

    await recordEvent(row.user_id, 'payment_missed', 0, HALF_LIFE_PAYMENT_DAYS, `${cycleId}:${row.user_id}`, {
      cycle_number: row.cycle_number,
      committee_name: row.committee_name,
      committee_id: committeeId,
    });
  }
});

/**
 * Committee closed → completion event for every approved member.
 */
export const onCommitteeClosed = safe('onCommitteeClosed', async (committeeId) => {
  const nameRes = await query(`SELECT name FROM committees WHERE id = $1`, [committeeId]);
  const committeeName = nameRes.rows[0]?.name || 'Committee';

  const membersRes = await query(
    `SELECT user_id FROM members WHERE committee_id = $1 AND status = 'approved'`,
    [committeeId]
  );
  for (const m of membersRes.rows) {
    await recordEvent(m.user_id, 'committee_completed', 1, HALF_LIFE_COMPLETION_DAYS, committeeId, {
      committee_name: committeeName,
    });
  }
});

/**
 * Member removed / left → dropout event ONLY if they had a missed
 * payment in that committee (protects against unfair removals).
 */
export const onMemberRemoved = safe('onMemberRemoved', async (userId, committeeId) => {
  const missedRes = await query(
    `SELECT 1 FROM payments p
     JOIN cycles cy ON cy.id = p.cycle_id
     WHERE cy.committee_id = $1 AND p.user_id = $2 AND p.status = 'overdue'
     LIMIT 1`,
    [committeeId, userId]
  );
  const missedEventRes = await query(
    `SELECT 1 FROM trust_score_events
     WHERE user_id = $1 AND event_type = 'payment_missed'
       AND detail->>'committee_id' = $2
     LIMIT 1`,
    [userId, committeeId]
  );

  if (missedRes.rows.length === 0 && missedEventRes.rows.length === 0) return; // clean removal → no penalty

  const nameRes = await query(`SELECT name FROM committees WHERE id = $1`, [committeeId]);
  await recordEvent(userId, 'committee_dropout', 0, HALF_LIFE_COMPLETION_DAYS, committeeId, {
    committee_name: nameRes.rows[0]?.name || 'Committee',
  });
});

/**
 * Complaint resolved against a user (fraud / payment dispute) → penalty.
 */
export const onComplaintResolved = safe('onComplaintResolved', async (complaintId) => {
  const res = await query(
    `SELECT accused_user_id, category FROM complaints WHERE id = $1`,
    [complaintId]
  );
  const complaint = res.rows[0];
  if (!complaint?.accused_user_id) return;
  if (!['payment_dispute', 'suspected_fraud'].includes(complaint.category)) return;

  await recordEvent(complaint.accused_user_id, 'complaint_penalty', -1, HALF_LIFE_COMPLETION_DAYS, complaintId, {
    category: complaint.category,
  });
});

/**
 * CNIC verified → just recompute (V is read live from users table).
 */
export const onCnicVerified = safe('onCnicVerified', async (userId) => {
  await recomputeUser(userId);
});

/* ── Bootstrap & backfill ── */

/**
 * Idempotent DDL bootstrap (startup, same pattern as other ensureXxx).
 */
export async function ensureTrustScoreTables() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS trust_score_events (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_type     TEXT NOT NULL CHECK (event_type IN (
          'payment_on_time','payment_late','payment_missed',
          'committee_completed','committee_dropout',
          'complaint_penalty','verification')),
        value          DECIMAL(4,3) NOT NULL,
        half_life_days INT NOT NULL,
        reference_id   TEXT NOT NULL,
        detail         JSONB,
        occurred_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (event_type, reference_id)
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_tse_user ON trust_score_events(user_id, occurred_at)`);
    // Align legacy default with the new 0–1000 model
    await query(`ALTER TABLE trust_scores ALTER COLUMN score SET DEFAULT 850`);
    console.log('✅ [TrustScore] trust_score_events table ready.');
  } catch (err) {
    console.error('❌ [TrustScore] Schema bootstrap failed:', err.message);
  }
}

/**
 * Derive events from historical payments/committees/members so
 * existing users get real scores immediately. Idempotent via the
 * UNIQUE (event_type, reference_id) constraint.
 */
export async function backfillTrustEvents() {
  try {
    // 1. Confirmed payments → on_time / late
    const paidRes = await query(
      `SELECT p.id, p.user_id, p.confirmed_at, cy.due_date, cy.cycle_number,
              c.interval_type, c.name AS committee_name, c.id AS committee_id
       FROM payments p
       JOIN cycles cy ON cy.id = p.cycle_id
       JOIN committees c ON c.id = cy.committee_id
       WHERE p.status = 'paid' AND p.confirmed_at IS NOT NULL`
    );
    for (const p of paidRes.rows) {
      const intervalDays = INTERVAL_DAYS[p.interval_type] || 30;
      const daysLate = Math.floor((new Date(p.confirmed_at) - new Date(p.due_date)) / MS_PER_DAY);
      const isLate = daysLate > 0;
      await recordEvent(
        p.user_id,
        isLate ? 'payment_late' : 'payment_on_time',
        isLate ? Number(clamp(1 - daysLate / intervalDays, 0, 1).toFixed(3)) : 1,
        HALF_LIFE_PAYMENT_DAYS,
        p.id,
        { days_late: Math.max(0, daysLate), interval_days: intervalDays, cycle_number: p.cycle_number, committee_name: p.committee_name, committee_id: p.committee_id },
        p.confirmed_at
      );
    }

    // 2. Closed cycles → missed payments for unpaid participants
    const closedCycles = await query(
      `SELECT cy.id AS cycle_id, cy.committee_id, cy.recipient_user_id
       FROM cycles cy WHERE cy.status = 'closed'`
    );
    for (const cy of closedCycles.rows) {
      const unpaidRes = await query(
        `SELECT m.user_id FROM members m
         WHERE m.committee_id = $1 AND m.status = 'approved'
           AND m.user_id IS DISTINCT FROM $2
           AND NOT EXISTS (
             SELECT 1 FROM payments p
             WHERE p.cycle_id = $3 AND p.user_id = m.user_id AND p.status = 'paid'
           )`,
        [cy.committee_id, cy.recipient_user_id, cy.cycle_id]
      );
      for (const row of unpaidRes.rows) {
        await recordEvent(row.user_id, 'payment_missed', 0, HALF_LIFE_PAYMENT_DAYS, `${cy.cycle_id}:${row.user_id}`, { backfilled: true, committee_id: cy.committee_id });
      }
    }

    // 3. Closed committees → completion events
    const closedComms = await query(
      `SELECT c.id, c.name FROM committees c WHERE c.status = 'closed'`
    );
    for (const comm of closedComms.rows) {
      const membersRes = await query(
        `SELECT user_id FROM members WHERE committee_id = $1 AND status = 'approved'`,
        [comm.id]
      );
      for (const m of membersRes.rows) {
        await recordEvent(m.user_id, 'committee_completed', 1, HALF_LIFE_COMPLETION_DAYS, comm.id, { committee_name: comm.name });
      }
    }

    console.log('✅ [TrustScore] Historical events backfilled.');
  } catch (err) {
    console.error('❌ [TrustScore] Backfill failed:', err.message);
  }
}
