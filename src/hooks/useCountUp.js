// src/hooks/useCountUp.js
import { useEffect, useState, useRef } from 'react';

export function useCountUp(end, baseDuration = 800) {
  const [count, setCount] = useState(0);
  const frameRef = useRef();
  const startTimeRef = useRef();
  const startValueRef = useRef(0);

  useEffect(() => {
    // Reset per nuova animazione
    startTimeRef.current = null;
    startValueRef.current = count;
    
    // Durata fissa per tutti i valori - animazione più veloce
    const duration = baseDuration;

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = timestamp - startTimeRef.current;
      const percentage = Math.min(progress / duration, 1);

      // Easing function per animazione più fluida
      const easeOutExpo = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      
      const diff = end - startValueRef.current;
      const currentCount = startValueRef.current + (diff * easeOutExpo);
      
      setCount(Math.floor(currentCount));

      if (percentage < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, baseDuration]);

  return count;
}
