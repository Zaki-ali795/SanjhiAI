/**
 * dashboardService.js — Dashboard overview API calls.
 */
import api from '../api';

const BASE = '/dashboard';

/**
 * Fetch authenticated user's dashboard overview data.
 * @returns {Promise<{
 *   user: { id, fullName, email, phoneNumber, photoUrl },
 *   trustScore: { score, onTimeRate, completedCommittees },
 *   financialSummary: { totalContributed, completedCyclesCount, nextPayout },
 *   committees: Array<{ id, name, contributionAmount, capacity, intervalType, userRole, memberCount, completedCycles, totalPool }>,
 *   recentNotifications: Array
 * }>}
 */
export function getDashboardOverview() {
  return api.get(BASE);
}

/**
 * Fetch authenticated user's recent activities history.
 */
export function getRecentActivities() {
  return api.get('/activities');
}

/**
 * Fetch the authenticated user's full trust score breakdown:
 * component points (base / reliability / completion / verification / penalties),
 * recent score events, and the disclosed formula. Recomputed live server-side.
 */
export function getTrustScoreBreakdown() {
  return api.get(`${BASE}/trust-score`);
}
