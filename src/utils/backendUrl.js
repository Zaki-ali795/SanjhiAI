/**
 * backendUrl.js — Centralized backend URL and asset resolution.
 * Handles Capacitor native mobile APK, local dev, and Railway production seamlessly.
 */

export function getBackendUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  }

  // Detect Capacitor native Android / iOS runtime
  const isCapacitor = typeof window !== 'undefined' && (
    window.Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && window.Capacitor)
  );

  if (isCapacitor) {
    return 'https://sanjhiai-production.up.railway.app';
  }

  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    if (host.includes('railway.app')) {
      return window.location.origin;
    }
  }

  return 'https://sanjhiai-production.up.railway.app';
}

export function resolvePhotoUrl(url) {
  if (!url) return null;
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${getBackendUrl()}${cleanPath}`;
}
