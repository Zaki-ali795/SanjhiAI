/**
 * committeeService.js — Committee CRUD, settings, and lifecycle.
 *
 * Maps to: committees, collection_accounts, organizers, co_organizers tables
 */
import api from '../api';

const BASE = '/committees';

/**
 * List committees the current user belongs to (any role).
 * @param {{ status?: string, page?: number, limit?: number }} params
 */
export function getMyCommittees(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`${BASE}?${qs}`);
}

/**
 * Get a single committee by ID with full details.
 * @param {string} id — committee UUID
 */
export function getCommittee(id) {
  return api.get(`${BASE}/${id}`);
}

export function getCommitteeById(id) {
  return getCommittee(id);
}

export function updatePaymentStatus(paymentId, payload) {
  return api.patch(`/payments/${paymentId}`, payload);
}

export function releasePayout(cycleId) {
  return api.post(`/cycles/${cycleId}/release`);
}

/**
 * Create a new committee.
 * @param {{
 *   name: string,
 *   contribution_amount: number,
 *   capacity: number,
 *   interval_type: '15_days' | '1_month' | '2_months',
 *   payout_order_type?: string
 * }} payload
 */
export function createCommittee(payload) {
  return api.post(BASE, payload);
}

/**
 * Parse committee details from natural language text using AI.
 * @param {{ text: string }} payload — natural language description
 * @returns {Promise<{ name, contribution_amount, capacity, interval_type }>}
 */
export function parseCommitteeAIText(payload) {
  return api.post(`${BASE}/parse-ai-text`, payload);
}

/**
 * Parse committee details from audio recording using AI.
 * @param {FormData} formData — audio file form data
 * @returns {Promise<{ transcript, parsed }>}
 */
export function parseCommitteeAIAudio(formData) {
  return api.upload(`${BASE}/parse-ai-audio`, formData);
}

/**
 * Set the schedule for a committee (generates cycles).
 * @param {string} committeeId
 * @param {{ start_date: string, interval_type: string }} payload
 */
export function setSchedule(committeeId, payload) {
  return api.post(`${BASE}/${committeeId}/schedule`, payload);
}

/**
 * Link or update the collection account for a committee.
 * @param {string} committeeId
 * @param {{ account_type: string, account_number: string, account_title: string }} payload
 */
export function linkCollectionAccount(committeeId, payload) {
  return api.post(`${BASE}/${committeeId}/collection-account`, payload);
}

/**
 * Get the collection account for a committee.
 * @param {string} committeeId
 */
export function getCollectionAccount(committeeId) {
  return api.get(`${BASE}/${committeeId}/collection-account`);
}

/**
 * Update committee settings (name, amount, etc.).
 * @param {string} committeeId
 * @param {object} payload — fields to update
 */
export function updateCommittee(committeeId, payload) {
  return api.patch(`${BASE}/${committeeId}`, payload);
}

/**
 * Freeze or close a committee.
 * @param {string} committeeId
 * @param {{ status: 'frozen' | 'closed' }} payload
 */
export function updateCommitteeStatus(committeeId, payload) {
  return api.patch(`${BASE}/${committeeId}/status`, payload);
}

/**
 * Get committee invite code / link.
 * @param {string} committeeId
 */
export function getInviteInfo(committeeId) {
  return api.get(`${BASE}/${committeeId}/invite`);
}

/**
 * Regenerate the invite code for a committee.
 * @param {string} committeeId
 */
export function regenerateInviteCode(committeeId) {
  return api.post(`${BASE}/${committeeId}/invite/regenerate`);
}

/**
 * Join a committee using an invite code.
 * @param {{ invite_code: string }} payload
 */
export function joinByCode(payload) {
  return api.post(`${BASE}/join`, payload);
}

/**
 * Get committee details by invite code for previewing.
 * @param {string} code
 */
export function getCommitteeByCode(code) {
  return api.get(`${BASE}/code/${code}`);
}

/**
 * Get committee progress — cycles, paid counts, current cycle info.
 * @param {string} committeeId
 */
export function getCommitteeProgress(committeeId) {
  return api.get(`${BASE}/${committeeId}/progress`);
}

/**
 * Get the organizer and co-organizers for a committee.
 * @param {string} committeeId
 */
export function getCommitteeOrganizers(committeeId) {
  return api.get(`${BASE}/${committeeId}/organizers`);
}

/**
 * List public committees in the marketplace.
 * @param {{ category?: string, search?: string }} params
 */
export function getPublicCommittees(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`${BASE}/public?${qs}`);
}

/**
 * Request to toggle a committee between public and private.
 * If co-organizers exist, this creates a pending approval request.
 * @param {string} committeeId
 */
export function requestPublicToggle(committeeId) {
  return api.post(`${BASE}/${committeeId}/request-public-toggle`);
}

/**
 * Approve a pending public/private toggle request.
 * @param {string} committeeId
 */
export function approvePublicToggle(committeeId) {
  return api.post(`${BASE}/${committeeId}/approve-public-toggle`);
}
