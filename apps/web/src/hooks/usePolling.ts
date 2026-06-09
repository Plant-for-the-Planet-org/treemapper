import { useEffect, useRef } from 'react';

/**
 * Runs `callback` every `intervalMs` while the browser tab is visible.
 *
 * - Pauses when the tab is hidden or backgrounded (saves API calls + battery).
 * - Fires one immediate refresh the moment the tab becomes visible again, so a
 *   user who tabs away and back sees fresh data without waiting a full cycle.
 * - Always calls the latest `callback` without resetting the timer, so the
 *   callback can safely close over changing state (page, filters, token).
 *
 * Pass `enabled = false` to suspend polling (e.g. before a project is selected).
 */
const usePolling = (callback: () => void, intervalMs: number, enabled = true): void => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer != null) return;
      timer = setInterval(() => savedCallback.current(), intervalMs);
    };
    const stop = () => {
      if (timer != null) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        savedCallback.current(); // immediate refresh on return
        start();
      } else {
        stop();
      }
    };

    // Only start ticking if the tab is currently visible.
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [intervalMs, enabled]);
};

export default usePolling;
