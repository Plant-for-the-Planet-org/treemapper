'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, RotateCcw, Satellite, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AnalysisResult, getAnalysisResult } from '@/lib/satellite-count/api';
import { extractPolygon } from '@/lib/satellite-count/mercator';
import {
  PendingJob,
  clearPendingJob,
  pointsFromResult,
  pointsFromReview,
} from '@/lib/satellite-count/review';
import type { SatelliteCountState } from '@/lib/satellite-count/useSatelliteCount';
import SatelliteCountCapture from './SatelliteCountCapture';
import SatelliteCountReview from './SatelliteCountReview';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intervention: { uid: string; hid?: string; originalGeometry?: unknown };
  projectUid?: string;
  reviewer?: { id?: string | number; name?: string };
  state: SatelliteCountState;
}

const Centered = ({ children }: { children: React.ReactNode }) => (
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="max-w-md w-full text-center space-y-4">{children}</div>
  </div>
);

function Processing({ job, progress, state, error, onClose, onCancel }: {
  job: PendingJob; progress: number; state?: string; error: string | null;
  onClose: () => void; onCancel: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const elapsed = Math.max(0, Math.round((now - new Date(job.submittedAt).getTime()) / 1000));
  const pct = Math.round(progress * 100);

  return (
    <Centered>
      <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          {state === 'running' ? 'Counting trees…' : 'Waiting to start…'}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {job.capture.width.toLocaleString()} × {job.capture.height.toLocaleString()} px image · zoom {job.capture.zoom} · {elapsed}s elapsed
        </p>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${Math.max(pct, 3)}%` }} />
      </div>
      <p className="text-sm text-muted-foreground">
        You can close this window. The count keeps running, and the result will be ready to review here
        when you come back to this intervention.
      </p>
      {error && (
        <p className="text-xs text-amber-700 flex items-center justify-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" /> {error}
        </p>
      )}
      <div className="flex justify-center gap-2">
        <Button variant="outline" onClick={onClose}>Close and come back later</Button>
        <Button variant="ghost" onClick={onCancel}>Discard</Button>
      </div>
    </Centered>
  );
}

export default function SatelliteCountModal({ open, onOpenChange, intervention, projectUid, reviewer, state }: Props) {
  const polygon = useMemo(() => extractPolygon(intervention.originalGeometry), [intervention.originalGeometry]);
  const { pending, status, statusError, review } = state;
  const [startNew, setStartNew] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  // a newly submitted job takes over the modal
  useEffect(() => { if (pending) setStartNew(false); }, [pending?.jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  // fetch detections once the job has finished
  const succeeded = !!pending && status?.id === pending.jobId && status.status === 'succeeded';
  useEffect(() => {
    if (!succeeded || !pending) { setResult(null); return; }
    let cancelled = false;
    setResultError(null);
    getAnalysisResult(pending.jobId)
      .then(r => { if (!cancelled) setResult(r); })
      .catch(err => { if (!cancelled) setResultError(err instanceof Error ? err.message : 'Could not load the result'); });
    return () => { cancelled = true; };
  }, [succeeded, pending?.jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  const resultPoints = useMemo(() => (result ? pointsFromResult(result) : []), [result]);
  const savedPoints = useMemo(() => (review ? pointsFromReview(review) : []), [review]);

  const startOver = () => {
    if (pending) clearPendingJob(intervention.uid);
    setStartNew(true);
  };

  let body: React.ReactNode;
  let subtitle = 'Count the trees inside this intervention from satellite imagery, then check and correct the result.';

  if (!polygon) {
    body = (
      <Centered>
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <p className="text-sm text-muted-foreground">
          Satellite count needs an intervention with a polygon boundary. This intervention only has a point location.
        </p>
      </Centered>
    );
  } else if (pending && status?.status === 'failed') {
    body = (
      <Centered>
        <XCircle className="h-10 w-10 text-destructive mx-auto" />
        <h3 className="text-lg font-semibold">The analysis failed</h3>
        <p className="text-sm text-muted-foreground">{status.error || 'Unknown error'}</p>
        <Button onClick={startOver}><RotateCcw className="h-4 w-4" /> Start over</Button>
      </Centered>
    );
  } else if (pending && succeeded) {
    subtitle = 'Check the detected trees on the imagery. Add any that were missed and remove false detections, then save.';
    body = result ? (
      <SatelliteCountReview
        key={pending.jobId}
        interventionUid={intervention.uid}
        interventionHid={intervention.hid}
        projectUid={projectUid}
        reviewer={reviewer}
        polygon={polygon}
        job={pending}
        summary={result.summary}
        warnings={result.warnings}
        initialPoints={resultPoints}
        jobOnServer
        onNewCount={startOver}
      />
    ) : (
      <Centered>
        {resultError ? (
          <>
            <p className="text-sm text-destructive">{resultError}</p>
            <Button variant="outline" onClick={startOver}>Start over</Button>
          </>
        ) : (
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        )}
      </Centered>
    );
  } else if (pending) {
    subtitle = 'The imagery was sent to the tree-count service.';
    body = (
      <Processing
        job={pending}
        progress={status?.progress ?? 0}
        state={status?.status}
        error={statusError}
        onClose={() => onOpenChange(false)}
        onCancel={startOver}
      />
    );
  } else if (review && !startNew) {
    const m = review.metadata;
    subtitle = 'Saved, human-reviewed count. Turn on editing to make further corrections.';
    body = (
      <SatelliteCountReview
        key={m.reviewed_at}
        interventionUid={intervention.uid}
        interventionHid={intervention.hid}
        projectUid={projectUid}
        reviewer={reviewer}
        polygon={polygon}
        job={{ jobId: m.analysis.job_id, apiUrl: m.analysis.api_url, submittedAt: m.imagery.capturedAt, capture: m.imagery, minScore: m.analysis.min_score }}
        summary={m.analysis.summary}
        warnings={m.analysis.warnings}
        initialPoints={savedPoints}
        saved={{ reviewedAt: m.reviewed_at, reviewedBy: m.reviewed_by?.name }}
        jobOnServer={Date.now() - new Date(m.imagery.capturedAt).getTime() < 72 * 3600 * 1000}
        onNewCount={() => setStartNew(true)}
      />
    );
  } else {
    subtitle = 'Choose the imagery date and detail level. The image is captured from the polygon boundary automatically.';
    body = (
      <>
        {statusError && !pending && (
          <p className="mx-4 mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{statusError}</p>
        )}
        <SatelliteCountCapture interventionUid={intervention.uid} polygon={polygon} />
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col gap-0 p-0 overflow-hidden w-[96vw] max-w-[96vw] sm:max-w-[min(1200px,96vw)] h-[90vh]"
        onInteractOutside={e => e.preventDefault()}
      >
        <DialogHeader className="px-5 py-4 border-b border-border pr-12">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Satellite className="h-4 w-4 text-primary" />
            Satellite Count{intervention.hid ? <span className="text-muted-foreground font-normal">· {intervention.hid}</span> : null}
          </DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
