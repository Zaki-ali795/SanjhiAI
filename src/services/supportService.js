/**
 * supportService.js — Complaints and notifications.
 *
 * Maps to: complaints, notifications tables
 */
import api from '../api';

// ─── Complaints ──────────────────────────────────────────────

const COMPLAINTS = '/complaints';

/**
 * File a new complaint or report.
 * @param {{
 *   committee_id?: string,
 *   accused_user_id?: string,
 *   category: 'payment_dispute' | 'harassment' | 'suspected_fraud' | 'other',
 *   description: string,
 *   evidence_url?: string
 * }} payload
 */
export function fileComplaint(payload) {
  return api.post(COMPLAINTS, payload);
}

/**
 * Report any user on the platform.
 * Alias with clear intent.
 */
export function reportUser({ accused_user_id, category, description, committee_id, evidence_url }) {
  return api.post(COMPLAINTS, {
    accused_user_id,
    category,
    description,
    committee_id: committee_id || null,
    evidence_url: evidence_url || null,
  });
}

/**
 * Search users by name, phone number, or email to file a report.
 * @param {string} query
 */
export function searchReportableUsers(query) {
  const qs = new URLSearchParams({ q: query }).toString();
  return api.get(`${COMPLAINTS}/search-users?${qs}`);
}

/**
 * Upload complaint evidence (image / document).
 * @param {string} complaintId
 * @param {File} file
 */
export function uploadEvidence(complaintId, file) {
  const formData = new FormData();
  formData.append('evidence', file);
  return api.upload(`${COMPLAINTS}/${complaintId}/evidence`, formData);
}

/**
 * Get the current user's complaints.
 * @param {{ status?: string, page?: number, limit?: number }} params
 */
export function getMyComplaints(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`${COMPLAINTS}/my?${qs}`);
}

/**
 * Get a single complaint's details.
 * @param {string} complaintId
 */
export function getComplaint(complaintId) {
  return api.get(`${COMPLAINTS}/${complaintId}`);
}

// ─── Notifications ───────────────────────────────────────────

const NOTIFICATIONS = '/notifications';

/**
 * Get current user's notifications.
 * @param {{ unread_only?: boolean, page?: number, limit?: number }} params
 */
export function getNotifications(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`${NOTIFICATIONS}?${qs}`);
}

/**
 * Mark a notification as read.
 * @param {string} notificationId
 */
export function markNotificationRead(notificationId) {
  return api.patch(`${NOTIFICATIONS}/${notificationId}/read`);
}

/**
 * Mark all notifications as read.
 */
export function markAllNotificationsRead() {
  return api.patch(`${NOTIFICATIONS}/read-all`);
}

/**
 * Get unread notification count.
 */
export function getUnreadCount() {
  return api.get(`${NOTIFICATIONS}/unread-count`);
}

/**
 * Delete a notification.
 * @param {string} notificationId
 */
export function deleteNotification(notificationId) {
  return api.delete(`${NOTIFICATIONS}/${notificationId}`);
}
