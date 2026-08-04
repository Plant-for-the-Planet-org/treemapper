'use client'

import { useCallback, useEffect, useState } from 'react';

/**
 * The two page-level messages: one success line and one error line.
 *
 * The success line clears itself. It confirms what just happened and is not a
 * record, so left up it is still on screen several matches later describing
 * something else. Errors are not cleared on a timer: they stay until the next
 * action clears them, because an error the user missed is worse than a stale one.
 *
 * It is a hook rather than two `useState` calls in the page because the ignore
 * flow and the auto-match run both report through it from their own hooks.
 */
export function useFeedback() {
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!lastAction) return;
    const t = setTimeout(() => setLastAction(null), 8000);
    return () => clearTimeout(t);
  }, [lastAction]);

  const notify = useCallback((message: string) => setLastAction(message), []);
  const fail = useCallback((message: string) => setActionError(message), []);
  const clearError = useCallback(() => setActionError(null), []);

  return { lastAction, actionError, notify, fail, clearError };
}

export type Feedback = ReturnType<typeof useFeedback>;
