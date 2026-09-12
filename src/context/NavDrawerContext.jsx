import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const NavDrawerContext = createContext({
  isDrawerOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
});

export function NavDrawerProvider({ children }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();

  // Automatically close drawer on route navigation
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  // Touch Swipe Gesture: Swipe right from left edge to open drawer, swipe left to close
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let isTracking = false;

    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      // Start tracking if starting near left edge (< 70px) when closed, or anywhere when open
      if (!isDrawerOpen && touchStartX < 70) {
        isTracking = true;
      } else if (isDrawerOpen) {
        isTracking = true;
      } else {
        isTracking = false;
      }
    };

    const handleTouchEnd = (e) => {
      if (!isTracking) return;
      isTracking = false;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Ensure horizontal swipe is dominant (not vertical scrolling)
      if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 65) {
        if (deltaX > 0 && !isDrawerOpen) {
          setIsDrawerOpen(true);
        } else if (deltaX < 0 && isDrawerOpen) {
          setIsDrawerOpen(false);
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDrawerOpen]);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  return (
    <NavDrawerContext.Provider value={{ isDrawerOpen, openDrawer, closeDrawer, toggleDrawer }}>
      {children}
    </NavDrawerContext.Provider>
  );
}

export function useNavDrawer() {
  const context = useContext(NavDrawerContext);
  if (!context) {
    throw new Error('useNavDrawer must be used within a NavDrawerProvider');
  }
  return context;
}
