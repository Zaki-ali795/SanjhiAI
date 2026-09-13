import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Suppress benign third-party/DevTools PerformanceObserver inspector errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event?.message?.includes?.('startTime') ||
      event?.filename === '' ||
      event?.filename?.includes?.('anonymous')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

/** Register Service Worker to cache all assets on the device */
if ('serviceWorker' in navigator && (import.meta.env?.PROD || window.location.protocol === 'https:')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[SW] Registration error:', err);
    });
  });
}

/** Dismiss the HTML splash screen smoothly once React paints */
function dismissSplash(minMs = 200) {
  const splash = document.getElementById('splash-root');
  if (!splash) return;

  const started = performance.now();

  function doHide() {
    const elapsed = performance.now() - started;
    const remaining = Math.max(0, minMs - elapsed);

    setTimeout(() => {
      splash.classList.add('hiding');
      splash.addEventListener('transitionend', () => {
        splash.classList.add('hidden');
      }, { once: true });
      // Fallback in case transitionend doesn't fire
      setTimeout(() => splash.classList.add('hidden'), 300);
    }, remaining);
  }

  // Wait for React to paint at least one frame
  requestAnimationFrame(() => requestAnimationFrame(doHide));
}

const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

dismissSplash(200);
