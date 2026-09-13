/**
 * api.js — Centralized HTTP client for the Sanjhi frontend.
 *
 * Features:
 *  - Auto-attaches Bearer token from localStorage
 *  - 15-second AbortController timeout per request
 *  - Request deduplication: same GET endpoint won't fire twice simultaneously
 *  - Humanized network errors: "Failed to fetch" → "Server is down"
 *
 * Usage:
 *   import api from './api';
 *   const data = await api.get('/committees');
 *   const created = await api.post('/committees', { name: 'Pool', ... });
 */

function getApiBaseUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }

  // Detect Capacitor native Android / iOS runtime
  const isCapacitor = typeof window !== 'undefined' && (
    window.Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && window.Capacitor)
  );

  if (isCapacitor) {
    return 'https://sanjhiai-production.up.railway.app/api';
  }

  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return '/api';
    }
    if (host.includes('railway.app')) {
      return `${window.location.origin}/api`;
    }
  }
  // Default for Netlify / external host deployments
  return 'https://sanjhiai-production.up.railway.app/api';
}

const BASE_URL = getApiBaseUrl();

/** Timeout for every request (ms) */
const REQUEST_TIMEOUT_MS = 15_000;

/** In-flight GET request deduplication map: endpoint → Promise */
const inFlight = new Map();

/**
 * Retrieves the stored auth token (JWT) from localStorage.
 */
function getToken() {
  return localStorage.getItem('sanjhi_token');
}

/**
 * Stores the auth token after login / signup.
 */
export function setToken(token) {
  localStorage.setItem('sanjhi_token', token);
}

/**
 * Removes the auth token on logout.
 */
export function clearToken() {
  localStorage.removeItem('sanjhi_token');
}

/**
 * Checks whether an error is a network-level failure
 * (server unreachable, no internet, CORS pre-flight blocked, etc.)
 */
function isNetworkError(err) {
  return (
    err instanceof TypeError &&
    (err.message === 'Failed to fetch' ||
      err.message.includes('NetworkError') ||
      err.message.includes('ERR_CONNECTION') ||
      err.message.includes('net::') ||
      err.message === 'Load failed')
  );
}

/**
 * Core request function — every HTTP method funnels through here.
 *
 * @param {string} endpoint  Path relative to BASE_URL, e.g. '/auth/otp'
 * @param {object} options   fetch options (method, body, headers…)
 * @returns {Promise<any>}   Parsed JSON response
 */
async function request(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const token = getToken();

  // --- Request deduplication for GET requests ---
  const dedupeKey = method === 'GET' ? `GET:${endpoint}` : null;
  if (dedupeKey && inFlight.has(dedupeKey)) {
    return inFlight.get(dedupeKey);
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = { ...options, headers };

  // If body is a plain object, stringify it automatically
  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  // FormData uploads — let the browser set Content-Type with the boundary
  if (config.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  // --- AbortController timeout ---
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  config.signal = controller.signal;

  const promise = (async () => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, config);

      // Handle 204 No Content
      if (response.status === 204) return null;

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        // Build a consistent error shape
        const error = new Error(data?.message || data?.error || `Request failed (${response.status})`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      // Timeout (AbortError)
      if (err.name === 'AbortError') {
        const timeoutError = new Error('Request timed out. Please check your connection and try again.');
        timeoutError.isNetworkError = true;
        throw timeoutError;
      }
      // Network-level failure — humanize the message
      if (isNetworkError(err)) {
        const networkError = new Error('Server is down. Please try again later.');
        networkError.isNetworkError = true;
        throw networkError;
      }
      // Re-throw API-level errors (4xx / 5xx) unchanged
      throw err;
    } finally {
      clearTimeout(timeoutId);
      if (dedupeKey) inFlight.delete(dedupeKey);
    }
  })();

  // Register in-flight for GET deduplication
  if (dedupeKey) inFlight.set(dedupeKey, promise);

  return promise;
}

/** Convenience wrappers */
const api = {
  get: (endpoint, opts) => request(endpoint, { ...opts, method: 'GET' }),
  post: (endpoint, body, opts) => request(endpoint, { ...opts, method: 'POST', body }),
  put: (endpoint, body, opts) => request(endpoint, { ...opts, method: 'PUT', body }),
  patch: (endpoint, body, opts) => request(endpoint, { ...opts, method: 'PATCH', body }),
  delete: (endpoint, opts) => request(endpoint, { ...opts, method: 'DELETE' }),

  /** Upload a file (FormData) */
  upload: (endpoint, formData, opts) =>
    request(endpoint, { ...opts, method: 'POST', body: formData }),
};

export default api;
