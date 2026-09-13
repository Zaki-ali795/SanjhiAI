/**
 * paymentService.js — Payments, payouts, and cycle tracking.
 *
 * Maps to: cycles, payments tables
 */
import api from '../api';

const BASE = '/committees';

// ─── Cycles ──────────────────────────────────────────────────

/**
 * List all cycles for a committee.
 * @param {string} committeeId
 * @param {{ status?: string, page?: number, limit?: number }} params
 */
export function getCycles(committeeId, params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`${BASE}/${committeeId}/cycles?${qs}`);
}

/**
 * Get a specific cycle's details.
 * @param {string} committeeId
 * @param {string} cycleId
 */
export function getCycle(committeeId, cycleId) {
  return api.get(`${BASE}/${committeeId}/cycles/${cycleId}`);
}

// ─── Payments ────────────────────────────────────────────────

/**
 * List payments for a specific cycle.
 * @param {string} committeeId
 * @param {string} cycleId
 * @param {{ status?: string }} params
 */
export function getCyclePayments(committeeId, cycleId, params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`${BASE}/${committeeId}/cycles/${cycleId}/payments?${qs}`);
}

/**
 * Submit a payment confirmation (payer uploads proof).
 * @param {string} committeeId
 * @param {string} cycleId
 * @param {{ sender_account_details?: string }} payload
 */
export function submitPayment(committeeId, cycleId, payload = {}) {
  return api.post(`${BASE}/${committeeId}/cycles/${cycleId}/payments`, payload);
}

/**
 * Upload payment proof (screenshot / receipt).
 * @param {string} committeeId
 * @param {string} cycleId
 * @param {File} file
 */
export function uploadPaymentProof(committeeId, cycleId, file) {
  const formData = new FormData();
  formData.append('proof', file);
  return api.upload(`${BASE}/${committeeId}/cycles/${cycleId}/payments/proof`, formData);
}

/**
 * Confirm a payment (organizer / co-organizer action).
 * @param {string} committeeId
 * @param {string} cycleId
 * @param {string} paymentId
 */
export function confirmPayment(committeeId, cycleId, paymentId) {
  return api.patch(`${BASE}/${committeeId}/cycles/${cycleId}/payments/${paymentId}/confirm`);
}

// ─── Payouts ─────────────────────────────────────────────────

/**
 * Release payout for a cycle's recipient.
 * @param {string} committeeId
 * @param {string} cycleId
 */
export function releasePayout(committeeId, cycleId) {
  return api.post(`${BASE}/${committeeId}/cycles/${cycleId}/payout/release`);
}

/**
 * Confirm payout received (recipient action).
 * @param {string} committeeId
 * @param {string} cycleId
 */
export function confirmPayoutReceived(committeeId, cycleId) {
  return api.patch(`${BASE}/${committeeId}/cycles/${cycleId}/payout/confirm`);
}

// ─── My Payments (user-scoped) ───────────────────────────────

/**
 * Get the current user's payment history across all committees.
 * @param {{ status?: string, page?: number, limit?: number }} params
 */
export function getMyPayments(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/payments/my?${qs}`);
}

/**
 * Get upcoming payments / dues for the current user.
 */
export function getUpcomingPayments() {
  return api.get('/payments/upcoming');
}

/**
 * Get payment summary / stats for the current user.
 */
export function getPaymentSummary() {
  return api.get('/payments/summary');
}
