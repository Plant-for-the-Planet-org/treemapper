'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import usePolling from '@/hooks/usePolling';
import { AnalysisApiError, AnalysisStatus, getAnalysisStatus } from './api';
import {
  CHANGE_EVENT,
  PendingJob,
  ReviewedCollection,
  clearPendingJob,
  loadPendingJob,
  loadReview,
} from './review';

const POLL_MS = 3000;

export interface SatelliteCountState {
  /** job submitted and not yet reviewed/discarded */
  pending: PendingJob | null;
  /** latest backend status of the pending job */
  status: AnalysisStatus | null;
  /** problem reaching the backend or an expired job */
  statusError: string | null;
  /** last saved, human-reviewed result */
  review: ReviewedCollection | null;
  refresh: () => void;
}

/**
 * Tracks the satellite count of one intervention: a pending backend job
 * (polled in the background, so the user can close the modal and come back)
 * and the saved review. `onReady` fires once when a job finishes.
 */
export function useSatelliteCount(
  interventionUid: string,
  onReady?: (status: AnalysisStatus) => void,
): SatelliteCountState {
  const [pending, setPending] = useState<PendingJob | null>(null);
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewedCollection | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const lastState = useRef<string | null>(null);

  const load = useCallback(() => {
    const job = loadPendingJob(interventionUid);
    setPending(prev => (prev?.jobId === job?.jobId ? prev : job));
    if (!job) {
      setStatus(null);
      setStatusError(null);
      lastState.current = null;
    }
    setReview(loadReview(interventionUid));
  }, [interventionUid]);

  useEffect(() => {
    load();
    const onChange = (e: Event) => {
      if ((e as CustomEvent).detail?.uid === interventionUid) load();
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, [interventionUid, load]);

  const poll = useCallback(async () => {
    if (!pending) return;
    try {
      const s = await getAnalysisStatus(pending.jobId);
      setStatus(s);
      setStatusError(null);
      if (s.status === 'succeeded' && lastState.current && lastState.current !== 'succeeded') {
        onReadyRef.current?.(s);
      }
      lastState.current = s.status;
    } catch (err) {
      if (err instanceof AnalysisApiError && err.status === 404) {
        setStatusError('This analysis is no longer available on the server (results are kept for 72 hours). Please run a new count.');
        clearPendingJob(interventionUid);
      } else {
        setStatusError(err instanceof Error ? err.message : 'Could not check the analysis status');
      }
    }
  }, [pending, interventionUid]);

  // check immediately when a job appears, then keep polling until it is finished
  useEffect(() => {
    if (pending) {
      // a job submitted recently counts as "in progress", so a fast finish
      // still triggers onReady; old jobs found on page load don't notify
      const recent = Date.now() - new Date(pending.submittedAt).getTime() < 10 * 60 * 1000;
      lastState.current = recent ? 'queued' : null;
      poll();
    }
  }, [pending?.jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = !!pending && (!status || status.status === 'queued' || status.status === 'running');
  usePolling(poll, POLL_MS, active);

  return { pending, status, statusError, review, refresh: load };
}
