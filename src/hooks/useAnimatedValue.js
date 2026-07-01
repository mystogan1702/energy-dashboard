import { useState, useEffect, useRef } from "react";

/**
 * Smoothly animates a numeric value from its previous value to the target value.
 * @param target The final value to display.
 * @param duration Animation duration in milliseconds (default 600).
 * @returns The smoothly animated value.
 */
export function useAnimatedValue(target, duration = 600) {
  const [current, setCurrent] = useState(target);
  const previousTarget = useRef(target);
  const frameRef = useRef(null);

  useEffect(() => {
    if (target === previousTarget.current) return;
    previousTarget.current = target;

    const start = current; // start from the currently displayed value
    const change = target - start;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic (optional, but makes it look natural)
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(start + change * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return current;
}