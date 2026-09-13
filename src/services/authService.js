/**
 * authService.js — User authentication & profile management.
 *
 * Maps to: users, otps, sessions tables
 */
import api, { setToken, clearToken } from '../api';

const BASE = '/auth';

/**
 * Send OTP to phone number or email for signup.
 * @param {{ target: string, purpose: 'signup' | 'login' }} payload
 */
export function sendOTP(payload) {
  return api.post(`${BASE}/otp/send`, payload);
}

/**
 * Login using Password.
 * @param {{ target: string, password: string }} payload
 */
export async function loginWithPassword(payload) {
  const data = await api.post(`${BASE}/login-password`, payload);
  if (data.token) setToken(data.token);
  return data;
}

/**
 * Verify OTP code.
 * @param {{ target: string, code: string, purpose: 'signup' | 'login' }} payload
 * @returns {Promise<{ token: string, user: object, isNew: boolean }>}
 */
export async function verifyOTP(payload) {
  const data = await api.post(`${BASE}/otp/verify`, payload);
  if (data.token) setToken(data.token);
  return data;
}


/**
 * Resend OTP (rate-limited on backend).
 * @param {{ target: string, purpose: 'signup' | 'login' }} payload
 */
export function resendOTP(payload) {
  return api.post(`${BASE}/otp/resend`, payload);
}

/**
 * Complete profile setup after first signup.
 * @param {{ full_name: string, age?: number, sex?: string, profile_photo_url?: string }} payload
 */
export function setupProfile(payload) {
  return api.put(`${BASE}/profile`, payload);
}

/**
 * Update user profile.
 * @param {object} payload — fields to update
 */
export function updateProfile(payload) {
  return api.patch(`${BASE}/profile`, payload);
}

/**
 * Get current authenticated user's profile.
 */
export function getProfile() {
  return api.get(`${BASE}/profile`);
}

/**
 * Upload or update profile photo.
 * @param {File} file
 */
export function uploadProfilePhoto(file) {
  const formData = new FormData();
  formData.append('photo', file);
  return api.upload(`${BASE}/profile/photo`, formData);
}

/**
 * Update notification preferences.
 * @param {{ push_enabled: boolean, sms_enabled: boolean, whatsapp_enabled: boolean }} prefs
 */
export function updateNotificationPrefs(prefs) {
  return api.put(`${BASE}/notification-preferences`, prefs);
}

/**
 * Get notification preferences.
 */
export function getNotificationPrefs() {
  return api.get(`${BASE}/notification-preferences`);
}

/**
 * Logout — revoke current session.
 */
export async function logout() {
  try {
    await api.post(`${BASE}/logout`);
  } finally {
    clearToken();
  }
}

/**
 * Send OTP code to a new contact (phone/email) to link to current profile.
 * @param {{ target: string }} payload
 */
export function sendContactOTP(payload) {
  return api.post(`${BASE}/contact/send-otp`, payload);
}

/**
 * Verify OTP code and link new contact (phone/email) to current profile.
 * @param {{ target: string, code: string }} payload
 */
export function verifyContactOTP(payload) {
  return api.post(`${BASE}/contact/verify-otp`, payload);
}

/**
 * Get current session info (useful for checking auth status on app load).
 */
export function getSession() {
  return api.get(`${BASE}/session`);
}

/**
 * Submit CNIC front/back images for verification.
 * @param {{ cnic_number: string, front: File, back: File }} payload
 */
export function submitCnic(payload) {
  const formData = new FormData();
  formData.append('cnic_number', payload.cnic_number);
  formData.append('front', payload.front);
  formData.append('back', payload.back);
  return api.upload(`${BASE}/cnic/submit`, formData);
}

/**
 * Run AI OCR on CNIC image to extract CNIC number & details.
 * @param {File} imageFile
 */
export function scanCnicOcr(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);
  return api.upload(`${BASE}/cnic/scan-ocr`, formData);
}

/**
 * Get current CNIC verification status.
 */
export function getCnicStatus() {
  return api.get(`${BASE}/cnic/status`);
}
