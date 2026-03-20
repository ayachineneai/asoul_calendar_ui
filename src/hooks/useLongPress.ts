import { useRef, useCallback } from 'react';

export function useLongPress(onLongPress: () => void, delay = 400) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onTouchStart = useCallback(() => {
    timer.current = setTimeout(() => {
      timer.current = null;
      navigator.vibrate?.(50);
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  // Returns true if the long press fired (so caller can skip normal tap)
  const onTouchEnd = useCallback((): boolean => {
    if (!timer.current) return true; // already fired
    cancel();
    return false;
  }, [cancel]);

  return { onTouchStart, onTouchMove: cancel, onTouchEnd };
}
