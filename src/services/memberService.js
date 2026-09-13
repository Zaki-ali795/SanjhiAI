/**
 * memberService.js — Member management, invites, and join requests.
 *
 * Maps to: members table
 */
import api from '../api';

const BASE = '/committees';

/**
 * List members of a committee.
 * @param {string} committeeId
 * @param {{ status?: string, page?: number, limit?: number }} params
 */
export function getMembers(committeeId, params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`${BASE}/${committeeId}/members?${qs}`);
}

/**
 * Get a single member's details within a committee.
 * @param {string} committeeId
 * @param {string} memberId
 */
export function getMember(committeeId, memberId) {
  return api.get(`${BASE}/${committeeId}/members/${memberId}`);
}

/**
 * Invite a user to a committee (sends a notification).
 * @param {string} committeeId
 * @param {{ phone_number?: string, email?: string }} payload
 */
export function inviteMember(committeeId, payload) {
  return api.post(`${BASE}/${committeeId}/members/invite`, payload);
}

/**
 * Add a member directly by ID/phone/email (Organizer only).
 * @param {string} committeeId
 * @param {{ identifier: string }} payload
 */
export function addMemberDirectly(committeeId, payload) {
  return api.post(`${BASE}/${committeeId}/members/add`, payload);
}

/**
 * Search registered users by name/phone/email to add to committee.
 * @param {string} committeeId
 * @param {string} query
 */
export function searchUsers(committeeId, query) {
  return api.get(`${BASE}/${committeeId}/members/search-users?q=${encodeURIComponent(query)}`);
}

/**
 * Bulk invite members.
 * @param {string} committeeId
 * @param {{ contacts: Array<{ phone_number?: string, email?: string }> }} payload
 */
export function bulkInvite(committeeId, payload) {
  return api.post(`${BASE}/${committeeId}/members/invite/bulk`, payload);
}

/**
 * List pending join requests for a committee (organizer view).
 * @param {string} committeeId
 */
export function getJoinRequests(committeeId) {
  return api.get(`${BASE}/${committeeId}/members/requests`);
}

/**
 * Approve a join request.
 * @param {string} committeeId
 * @param {string} memberId — the member row ID to approve
 */
export function approveJoinRequest(committeeId, memberId) {
  return api.patch(`${BASE}/${committeeId}/members/${memberId}/approve`);
}

/**
 * Reject a join request.
 * @param {string} committeeId
 * @param {string} memberId
 */
export function rejectJoinRequest(committeeId, memberId) {
  return api.patch(`${BASE}/${committeeId}/members/${memberId}/reject`);
}

/**
 * Remove a member from a committee.
 * @param {string} committeeId
 * @param {string} memberId
 */
export function removeMember(committeeId, memberId) {
  return api.delete(`${BASE}/${committeeId}/members/${memberId}`);
}

/**
 * Set a member's payout turn order.
 * @param {string} committeeId
 * @param {string} memberId
 * @param {{ payout_turn_order: number }} payload
 */
export function setPayoutOrder(committeeId, memberId, payload) {
  return api.patch(`${BASE}/${committeeId}/members/${memberId}/payout-order`, payload);
}

/**
 * Promote a member to co-organizer.
 * @param {string} committeeId
 * @param {string} memberId
 */
export function promoteToCoOrganizer(committeeId, memberId) {
  return api.post(`${BASE}/${committeeId}/co-organizers`, { member_id: memberId });
}

/**
 * Demote a co-organizer back to member.
 * @param {string} committeeId
 * @param {string} coOrganizerId
 */
export function demoteCoOrganizer(committeeId, coOrganizerId) {
  return api.delete(`${BASE}/${committeeId}/co-organizers/${coOrganizerId}`);
}
