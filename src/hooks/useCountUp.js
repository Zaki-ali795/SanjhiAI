import { useState, useEffect, useRef } from 'react';

/**
 * Ultra-smooth physics-curved Count-Up hook.
 * - Smoothly interpolates from previous rendered value to new target (never snaps to 0).
 * - Fourth-order ease-out (1 - (1 - t)^4) for natural, fluid deceleration.
 * - Complete requestAnimationFrame lifecycle cleanup to eliminate stutter and race conditions.
 * - Guarantees landing precisely on the target value.
 */
export function useCountUp(target, duration = 1200, active = true) {
  const targetNum = typeof target === 'number' ? target : parseFloat(target) || 0;
  const [count, setCount] = useState(0);
  const countRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    const startVal = countRef.current;
    const endVal = targetNum;

    if (startVal === endVal) {
      setCount(endVal);
      return;
    }

    let frameId;
    const start = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

    const step = (now) => {
      const current = typeof now === 'number' ? now : (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
      const elapsed = current - start;
      const progress = Math.min(elapsed / Math.max(duration, 200), 1);

      // Fourth-order ease-out: starts briskly and glides to a stop smoothly
      const ease = 1 - Math.pow(1 - progress, 4);
      const currentVal = Math.round(startVal + (endVal - startVal) * ease);

      countRef.current = currentVal;
      setCount(currentVal);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        countRef.current = endVal;
        setCount(endVal);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [targetNum, duration, active]);

  return count;
}

export default useCountUp;
