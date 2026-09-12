import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition — Wraps page content with a smooth CSS fade+slide animation
 * on every route change. Pure CSS, no Framer Motion needed.
 *
 * Usage: wrap your <Routes> with <PageTransition>...</PageTransition>
 */
export default function PageTransition({ children }) {
  const location = useLocation();
  const wrapperRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const el = wrapperRef.current;
    if (!el) return;

    // Remove then re-add class to restart animation
    el.classList.remove('page-enter');
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add('page-enter');
  }, [location.pathname]);

  return (
    <div ref={wrapperRef} className="page-enter w-full min-h-screen">
      {children}
    </div>
  );
}
