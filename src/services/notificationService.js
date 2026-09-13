/**
 * notificationService.js — Client-side API wrapper for Notifications.
 */
import api from '../api';

const BASE = '/notifications';

export function getNotifications(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(qs ? `${BASE}?${qs}` : BASE);
}

export function getUnreadCount() {
  return api.get(`${BASE}/unread-count`);
}

export function markAsRead(id) {
  return api.patch(`${BASE}/${id}/read`);
}

export function markAllAsRead() {
  return api.patch(`${BASE}/read-all`);
}
