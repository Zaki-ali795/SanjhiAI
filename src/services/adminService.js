/**
 * adminService.js — Platform admin operations.
 *
 * Maps to: admins, admin_action_logs tables + admin-scoped views
 * of users, committees, complaints.
 */
import api from '../api';

const BASE = '/admin';

// ─── Dashboard / Overview ────────────────────────────────────

/**
 * Get admin dashboard overview stats.
 * @returns {Promise<{ total_users, total_committees, active_complaints, total_payments, ... }>}
 */
export function getOverview() {
  return api.get(`${BASE}/overview`);
}

// ─── User Management ─────────────────────────────────────────

/**
 * List all users (admin view).
 * @param {{ search?: string, is_suspended?: boolean, page?: number, limit?: number }} params
 */
export function getUsers(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`${BASE}/users?${qs}`);
}

/**
 * Get a user's full details (admin view).
 * @param {string} userId
 */
export function getUser(userId) {
  return api.get(`${BASE}/users/${userId}`);
}

/**
 * Suspend a user.
 * @param {string} userId
 * @param {{ notes?: string }} payload
 */
export function suspendUser(userId, payload = {}) {
  return api.post(`${BASE}/users/${userId}/suspend`, payload);
}

/**
 * Unsuspend a user.
 * @param {string} userId
 */
export function unsuspendUser(userId) {
  return api.post(`${BASE}/users/${userId}/unsuspend`);
}

// ─── Committee Management ────────────────────────────────────

/**
 * List all committees (admin view).
 * @param {{ status?: string, search?: string, page?: number, limit?: number }} params
 */
export function getCommittees(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`${BASE}/committees?${qs}`);
}

/**
 * Get committee details (admin view with extra info).
 * @param {string} committeeId
 */
export function getCommittee(committeeId) {
  return api.get(`${BASE}/committees/${committeeId}`);
}

/**
 * Freeze a committee.
 * @param {string} committeeId
 * @param {{ notes?: string }} payload
 */
export function freezeCommittee(committeeId, payload = {}) {
  return api.post(`${BASE}/committees/${committeeId}/freeze`, payload);
}

/**
 * Unfreeze a committee.
 * @param {string} committeeId
 */
export function unfreezeCommittee(committeeId) {
  return api.post(`${BASE}/committees/${committeeId}/unfreeze`);
}

// ─── Complaints / Disputes ───────────────────────────────────

/**
 * List all complaints (admin view).
 * @param {{ status?: string, priority?: string, category?: string, page?: number, limit?: number }} params
 */
export function getComplaints(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`${BASE}/complaints?${qs}`);
}

/**
 * Resolve a complaint.
 * @param {string} complaintId
 * @param {{ notes?: string }} payload
 */
export function resolveComplaint(complaintId, payload = {}) {
  return api.post(`${BASE}/complaints/${complaintId}/resolve`, payload);
}

/**
 * Dismiss a complaint.
 * @param {string} complaintId
 * @param {{ notes?: string }} payload
 */
export function dismissComplaint(complaintId, payload = {}) {
  return api.post(`${BASE}/complaints/${complaintId}/dismiss`, payload);
}

/**
 * Re-run the AI Case-Builder investigation for a complaint.
 * @param {string} complaintId
 */
export function reinvestigateComplaint(complaintId) {
  return api.post(`${BASE}/complaints/${complaintId}/reinvestigate`);
}

// ─── Activity Logs ───────────────────────────────────────────

/**
 * Get admin action logs.
 * @param {{ admin_id?: string, action_type?: string, page?: number, limit?: number }} params
 */
export function getActivityLogs(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`${BASE}/logs?${qs}`);
}

// ─── Analytics ───────────────────────────────────────────────

/**
 * Get platform analytics data.
 */
export function getAnalytics(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`${BASE}/analytics?${qs}`);
}

// ─── Platform Settings ───────────────────────────────────────

/**
 * Get global platform settings.
 */
export function getPlatformSettings() {
  return api.get(`${BASE}/settings`);
}

/**
 * Update global platform settings.
 */
export function updatePlatformSettings(payload) {
  return api.put(`${BASE}/settings`, payload);
}

// ─── Announcements / Notifications ────────────────────────────

/**
 * Get broadcast announcements list.
 */
export function getAnnouncements() {
  return api.get(`${BASE}/announcements`);
}

/**
 * Create a system-wide or targeted broadcast announcement.
 */
export function createAnnouncement(payload) {
  return api.post(`${BASE}/announcements`, payload);
}

// ─── CNIC Verification ───────────────────────────────────────

/**
 * List pending CNIC verification submissions.
 */
export function getPendingCnics() {
  return api.get(`${BASE}/cnic/pending`);
}

/**
 * Approve a user's CNIC verification.
 * @param {string} userId
 */
export function approveCnic(userId) {
  return api.post(`${BASE}/cnic/${userId}/verify`);
}

/**
 * Reject a user's CNIC verification submission.
 * @param {string} userId
 * @param {{ reason?: string }} payload
 */
export function rejectCnic(userId, payload = {}) {
  return api.post(`${BASE}/cnic/${userId}/reject`, payload);
}

// ─── QA Assistant Knowledge Base ─────────────────────────────

/**
 * List all assistant knowledge-base documents.
 */
export function getKbDocs() {
  return api.get(`${BASE}/kb-docs`);
}

/**
 * Create a knowledge-base document.
 * @param {{ title: string, category: string, content: string, keywords?: string[], priority?: number }} payload
 */
export function createKbDoc(payload) {
  return api.post(`${BASE}/kb-docs`, payload);
}

/**
 * Update a knowledge-base document (partial).
 * @param {string} docId
 * @param {object} payload
 */
export function updateKbDoc(docId, payload) {
  return api.patch(`${BASE}/kb-docs/${docId}`, payload);
}

/**
 * Delete a knowledge-base document.
 * @param {string} docId
 */
export function deleteKbDoc(docId) {
  return api.delete(`${BASE}/kb-docs/${docId}`);
}

/**
 * Assistant analytics: unanswered queries, feedback totals, top docs.
 */
export function getKbAnalytics() {
  return api.get(`${BASE}/kb-docs/analytics`);
}
