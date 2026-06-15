'use client';

import React, { useState, useEffect } from 'react';
import {
  InterventionApprovalData,
  SiteApprovalData,
  ApprovalData,
  ApprovalStatus,
  ReviewThread,
  ReviewComment,
  isInterventionApproval,
  isSiteApproval,
} from '@shared-core/types/approval.types';
import {
  getInterventionReviewDetails,
  getCurrentThread,
  getCurrentSiteThread,
} from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow } from 'date-fns';
import {
  Check,
  X,
  ExternalLink,
  Send,
  AlertTriangle,
  Leaf,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { cdnUrl } from '@/lib/cdn';
import { SiteMapView } from './SiteMapView';
import { STATUS_STYLES, avatarColor, initials, titleCase } from './approvalUi';

interface ApprovalModalProps {
  intervention: ApprovalData | null;
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onStatusChange: (
    newStatus: ApprovalStatus,
    comment: string,
    isInternal: boolean
  ) => Promise<boolean> | void;
  onCommentAdd: (comment: string, isInternal: boolean) => Promise<boolean> | void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  intervention,
  isOpen,
  isAdmin,
  onClose,
  onStatusChange,
  onCommentAdd,
}) => {
  const { accessToken } = useToken();
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ApprovalStatus | null>(null);
  const [currentThread, setCurrentThread] = useState<ReviewThread | null>(null);
  const [threadComments, setThreadComments] = useState<ReviewComment[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailedData, setDetailedData] = useState<Record<string, any> | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch review thread and comments when modal opens
  useEffect(() => {
    if (isOpen && intervention) {
      if (isInterventionApproval(intervention)) {
        loadReviewThread();
      } else if (isSiteApproval(intervention)) {
        loadSiteThread();
      }
    }
  }, [isOpen, intervention]);

  // Fetch richer intervention details when modal opens
  useEffect(() => {
    if (isOpen && intervention && isInterventionApproval(intervention)) {
      loadInterventionDetails();
    } else {
      setDetailedData(null);
    }
  }, [isOpen, intervention]);

  const loadInterventionDetails = async () => {
    if (!intervention || !isInterventionApproval(intervention) || !accessToken) return;
    try {
      setLoadingDetails(true);
      const resp = await getInterventionReviewDetails(accessToken, intervention.interventionUid);
      if (resp && resp.statusCode === 200 && resp.data) {
        setDetailedData(resp.data);
      } else {
        setDetailedData(null);
      }
    } catch (err) {
      console.error('Failed to load intervention details:', err);
      setDetailedData(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const loadReviewThread = async () => {
    if (!intervention || !isInterventionApproval(intervention) || !accessToken) return;

    try {
      setLoadingThread(true);
      const threadResponse = await getCurrentThread(
        accessToken,
        intervention.interventionUid
      );

      if (threadResponse.statusCode === 200 && threadResponse.data) {
        setCurrentThread(threadResponse.data);
        // Comments come embedded across all threads (any status), so decided
        // items still show their full history.
        setThreadComments(threadResponse.data.comments ?? []);
      } else {
        setCurrentThread(null);
        setThreadComments([]);
      }
    } catch (err) {
      console.error('Failed to load review thread:', err);
      setCurrentThread(null);
      setThreadComments([]);
    } finally {
      setLoadingThread(false);
    }
  };

  const loadSiteThread = async () => {
    if (!intervention || !isSiteApproval(intervention) || !accessToken) return;
    try {
      setLoadingThread(true);
      const threadResponse = await getCurrentSiteThread(accessToken, intervention.siteUid);
      if (threadResponse.statusCode === 200 && threadResponse.data) {
        setCurrentThread(threadResponse.data);
        // Comments come embedded across all threads (any status).
        setThreadComments(threadResponse.data.comments ?? []);
      } else {
        setCurrentThread(null);
        setThreadComments([]);
      }
    } catch (err) {
      console.error('Failed to load site review thread:', err);
      setCurrentThread(null);
      setThreadComments([]);
    } finally {
      setLoadingThread(false);
    }
  };

  if (!intervention) return null;

  // Type check
  const isIntervention = isInterventionApproval(intervention);
  const isSite = isSiteApproval(intervention);

  const formatType = (type: string) => {
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const topSpeciesString = (() => {
    const dist = detailedData?.speciesDistribution;
    if (!dist) return '';
    const entries = Object.entries(dist).sort((a: any, b: any) => (b[1] as number) - (a[1] as number));
    return entries.slice(0, 3).map(([k, v]) => `${k} (${v})`).join(', ');
  })();
  // prefer detailedData location if available
  const mapLocation = isIntervention
    ? (detailedData?.location || intervention.interventionData.location)
    : (detailedData?.location || intervention.siteData.location);

  const handleSubmit = async () => {
    if (submitting) return;

    if (targetStatus) {
      if (targetStatus === 'rejected' && !comment.trim()) {
        alert('Comment is required when rejecting');
        return;
      }
      setSubmitting(true);
      const ok = await onStatusChange(targetStatus, comment.trim(), isInternal);
      setSubmitting(false);
      // Status change moves the card and the parent closes the modal.
      // Keep the form on failure so the user can retry.
      if (ok === false) return;
    } else {
      if (!comment.trim()) return;
      setSubmitting(true);
      const ok = await onCommentAdd(comment.trim(), isInternal);
      if (ok !== false) {
        // Refresh the thread inline so the new comment shows without
        // closing the modal or reloading the board.
        if (isInterventionApproval(intervention)) {
          await loadReviewThread();
        } else if (isSiteApproval(intervention)) {
          await loadSiteThread();
        }
      }
      setSubmitting(false);
      if (ok === false) return;
    }

    setComment('');
    setIsInternal(false);
    setShowCommentForm(false);
    setTargetStatus(null);
  };

  // Approve submits immediately; reject / request-changes reveal the comment box.
  const handleApprove = async () => {
    if (submitting) return;
    setSubmitting(true);
    const ok = await onStatusChange('approved', '', isInternal);
    setSubmitting(false);
    if (ok === false) return;
  };

  // Move a pending submission into review (pending -> in_review).
  const handleStartReview = async () => {
    if (submitting) return;
    setSubmitting(true);
    const ok = await onStatusChange('in_review', '', isInternal);
    setSubmitting(false);
    if (ok === false) return;
  };

  const openDecisionForm = (status: ApprovalStatus) => {
    setTargetStatus(status);
    setShowCommentForm(true);
    setComment('');
  };

  const cancelDecisionForm = () => {
    setShowCommentForm(false);
    setTargetStatus(null);
    setComment('');
    setIsInternal(false);
  };

  const relativeTime = (date?: string | Date | null) => {
    if (!date) return '';
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const legacyStatus = intervention.approvalStatus;
  const accent = STATUS_STYLES[legacyStatus];
  const statusLabel = titleCase(intervention.reviewStatus || intervention.approvalStatus);
  const headerRef = isIntervention ? intervention.interventionHid : intervention.siteUid;
  const title = isIntervention ? formatType(intervention.type) : intervention.name;
  const creator = intervention.createdBy?.name || 'Unknown';

  // Approved / rejected are terminal in the backend: the decision endpoint is
  // irreversible and comments are only accepted while in_review. So a decided
  // card shows its outcome read-only instead of action buttons or a comment box.
  const isDecided = legacyStatus === 'approved' || legacyStatus === 'rejected';
  const decidedAt = legacyStatus === 'approved' ? intervention.approvedAt : intervention.rejectedAt;
  const deciderName = intervention.approvedBy?.name || '';

  // The backend only supports two transitions: pending -> in_review (start
  // review) and in_review -> approved | rejected (decide). So the actions we
  // show depend on the current state. There is no "request changes" state.
  const isPending = legacyStatus === 'new_request';

  // Species composition (interventions) sorted desc, scaled to the top species.
  const speciesEntries: Array<[string, number]> = isIntervention && detailedData?.speciesDistribution
    ? (Object.entries(detailedData.speciesDistribution) as Array<[string, number]>)
        .sort((a, b) => b[1] - a[1])
    : [];
  const speciesMax = speciesEntries.length ? speciesEntries[0][1] : 0;

  // Single-tree registrations have no sample plots or measured area, so we
  // drop those tiles for them.
  const isSingleTree = isIntervention && intervention.type === 'single-tree-registration';

  // Compact stat tiles shown under the title.
  const statTiles = isIntervention
    ? [
        { label: 'Trees', value: (detailedData?.totalTreeCount ?? intervention.interventionData.totalTreeCount ?? 0).toLocaleString() },
        ...(isSingleTree ? [] : [{ label: 'Sample trees', value: (detailedData?.totalSampleTreeCount ?? intervention.interventionData.totalSampleTreeCount ?? 0).toLocaleString() }]),
        { label: 'Species', value: (intervention.interventionData.speciesCount ?? speciesEntries.length ?? 0).toLocaleString() },
        ...(isSingleTree ? [] : [{ label: 'Area', value: intervention.interventionData.area ? `${(intervention.interventionData.area / 10000).toFixed(1)} ha` : '-' }]),
      ]
    : [
        { label: 'Area', value: intervention.siteData.area ? `${(intervention.siteData.area / 10000).toFixed(2)} ha` : '-' },
        { label: 'Expected trees', value: intervention.siteData.expectedTreeCount ? intervention.siteData.expectedTreeCount.toLocaleString() : '-' },
        { label: 'Status', value: titleCase(intervention.siteData.status) },
        { label: 'Elevation', value: intervention.siteData.elevation != null ? `${intervention.siteData.elevation} m` : '-' },
      ];

  // Interventions often lack a reliable field photo, so we don't show the
  // intervention image. Instead we show photos of the trees that have them.
  const treeImages: Array<{ image: string; label: string }> = isIntervention
    ? (detailedData?.trees || [])
        .filter((t: any) => t && t.image)
        .map((t: any) => ({
          image: cdnUrl('tree', t.image) ?? (t.image as string),
          label: t.commonName || t.species || t.tag || t.hid || '',
        }))
    : [];
  const siteImage = isSite ? intervention.siteData.image : null;

  // Normalise the location into a GeoJSON geometry SiteMapView understands.
  // Some records store the location as a plain { lat, lng } point instead.
  const toGeometry = (loc: any): any => {
    if (!loc || typeof loc !== 'object') return null;
    if (loc.type) return loc;
    if (loc.lat != null && loc.lng != null) return { type: 'Point', coordinates: [loc.lng, loc.lat] };
    return null;
  };
  const mapGeometry = toGeometry(mapLocation);

  const openInMaps = () => {
    const loc = mapLocation;
    if (loc && typeof loc === 'object' && loc.lat && loc.lng) {
      window.open(`https://www.google.com/maps?q=${loc.lat},${loc.lng}`, '_blank');
    }
  };

  // Details rows for the sidebar.
  const detailRows: Array<{ label: string; value: React.ReactNode }> = isIntervention
    ? [
        { label: 'Project', value: intervention.projectName || '-' },
        { label: 'Type', value: formatType(intervention.type) },
        { label: 'Submitted', value: intervention.submittedForReviewAt ? relativeTime(intervention.submittedForReviewAt) : '-' },
        { label: 'Reviewer', value: intervention.approvedBy?.name || 'Unassigned' },
        { label: 'Capture mode', value: intervention.interventionData.captureMode ? titleCase(intervention.interventionData.captureMode) : '-' },
      ]
    : [
        { label: 'Project', value: intervention.projectName || '-' },
        { label: 'Status', value: titleCase(intervention.siteData.status) },
        { label: 'Created', value: relativeTime(intervention.siteData.createdAt) },
        { label: 'Reviewer', value: intervention.approvedBy?.name || 'Unassigned' },
        { label: 'Water access', value: intervention.siteData.waterAccess ? 'Available' : 'Not available' },
      ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="!max-w-[1040px] w-[95vw] max-h-[92vh] p-0 gap-0 overflow-hidden flex flex-col"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <DialogTitle className="shrink-0 font-semibold text-foreground">{headerRef}</DialogTitle>
            {intervention.projectName && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <span className="truncate text-muted-foreground">{intervention.projectName}</span>
              </>
            )}
            <span className="text-muted-foreground/50">·</span>
            <span className="shrink-0 text-muted-foreground">Approvals</span>
            <span className={cn('ml-1 inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', accent.tint, accent.text)}>
              <span className={cn('size-1.5 rounded-full', accent.dot)} />
              {statusLabel}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {mapLocation && typeof mapLocation === 'object' && mapLocation.lat && mapLocation.lng && (
              <Button variant="outline" size="sm" className="h-8" onClick={openInMaps}>
                <ExternalLink className="h-3.5 w-3.5" />
                Open in map
              </Button>
            )}
            <DialogClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </div>

        {/* Body */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_320px]">
          {/* LEFT */}
          <div className="space-y-5 overflow-y-auto p-5">
            {/* Title + submitted line */}
            <div>
              <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Submitted by <span className="font-medium text-foreground/80">{creator}</span>
                {intervention.submittedForReviewAt && <> · {relativeTime(intervention.submittedForReviewAt)}</>}
                {intervention.projectName && <> · {intervention.projectName}</>}
              </p>
            </div>

            {/* Stat tiles */}
            <div className={cn(
              'grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border',
              statTiles.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-4'
            )}>
              {statTiles.map((t) => (
                <div key={t.label} className="bg-card px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{t.label}</div>
                  <div className="mt-0.5 text-lg font-semibold text-foreground">{t.value}</div>
                </div>
              ))}
            </div>

            {/* Location map */}
            {mapGeometry && (
              <div className="relative h-56 w-full overflow-hidden rounded-xl border border-border bg-muted">
                <SiteMapView
                  location={mapGeometry}
                  className="h-full w-full"
                  markerInfo={
                    isIntervention
                      ? { title: intervention.interventionHid, subtitle: topSpeciesString }
                      : { title: intervention.siteUid, subtitle: intervention.name || '' }
                  }
                />
              </div>
            )}

            {/* Site photo (interventions don't reliably carry a field photo) */}
            {isSite && siteImage && (
              <div className="relative h-56 w-full overflow-hidden rounded-xl border border-border bg-muted">
                <img src={siteImage} alt={title} className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                  <span className="text-xs font-medium text-white">
                    Site photo{intervention.projectName ? ` · ${intervention.projectName}` : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Tree photos (interventions) */}
            {treeImages.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tree photos</h3>
                  <span className="text-xs text-muted-foreground">{treeImages.length} {treeImages.length === 1 ? 'photo' : 'photos'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {treeImages.map((t, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                      <img src={t.image} alt={t.label || 'Tree photo'} className="h-full w-full object-cover" />
                      {t.label && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                          <span className="truncate text-[10px] font-medium text-white">{t.label}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Species composition */}
            {speciesEntries.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Species composition</h3>
                  <span className="text-xs text-muted-foreground">{speciesEntries.length} species recorded</span>
                </div>
                <div className="space-y-2.5">
                  {speciesEntries.slice(0, 6).map(([name, count]) => (
                    <div key={name} className="flex items-center gap-3">
                      <Leaf size={14} className="shrink-0 text-emerald-600" />
                      <span className="w-36 shrink-0 truncate text-sm text-foreground">{name}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${speciesMax ? (count / speciesMax) * 100 : 0}%` }} />
                      </div>
                      <span className="w-10 shrink-0 text-right text-sm tabular-nums text-muted-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {isIntervention && intervention.interventionData.description && (
              <p className="text-sm text-foreground/80">{intervention.interventionData.description}</p>
            )}
            {isSite && intervention.description && (
              <p className="text-sm text-foreground/80">{intervention.description}</p>
            )}

            {/* Discussion */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Discussion</h3>
              {loadingThread ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : threadComments.length > 0 ? (
                <div className="space-y-4">
                  {threadComments.map((c) => {
                    const author = c.author?.displayName || 'Unknown';
                    const isReviewer = c.authorRole === 'admin' || c.authorRole === 'reviewer';
                    return (
                      <div key={c.uid} className="flex gap-3">
                        <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold', avatarColor(author))}>
                          {initials(author)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{author}</span>
                            <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-medium', isReviewer ? 'bg-amber-50 text-amber-700' : 'bg-muted text-muted-foreground')}>
                              {c.authorRole === 'contributor' ? 'Field collector' : isReviewer && c.type !== 'general' ? 'Internal note' : titleCase(c.authorRole)}
                            </span>
                            <span className="text-xs text-muted-foreground">{relativeTime(c.createdAt)}</span>
                          </div>
                          <p className="mt-1 text-sm text-foreground/80">{c.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              )}

              {/* Comment input (hidden while a decision form is open, and once
                  the item is decided -- the backend rejects comments then). */}
              {!showCommentForm && isDecided && (
                <p className="mt-4 text-xs text-muted-foreground">
                  This {isIntervention ? 'intervention' : 'site'} is {legacyStatus}. The discussion is closed.
                </p>
              )}
              {!showCommentForm && !isDecided && (
                <div className="mt-4">
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment or request changes..."
                    rows={3}
                    className="resize-none"
                  />
                  {isAdmin && (
                    <div className="mt-2 flex items-center gap-2">
                      <Checkbox id="internal-note" checked={isInternal} onCheckedChange={(v) => setIsInternal(v as boolean)} />
                      <Label htmlFor="internal-note" className="text-xs text-muted-foreground">Internal note (visible to reviewers only)</Label>
                    </div>
                  )}
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" disabled={submitting || !comment.trim()} onClick={handleSubmit}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Comment
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6 overflow-y-auto border-t border-border bg-muted/20 p-5 lg:border-l lg:border-t-0">
            {/* Decision */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Decision</h3>
              {isDecided ? (
                <div className="space-y-2">
                  <div className={cn('flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium', accent.tint, accent.text)}>
                    {legacyStatus === 'approved' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    {statusLabel}
                  </div>
                  {(deciderName || decidedAt) && (
                    <p className="text-xs text-muted-foreground">
                      {deciderName && <>by <span className="font-medium text-foreground/80">{deciderName}</span></>}
                      {deciderName && decidedAt ? ' · ' : ''}
                      {decidedAt ? relativeTime(decidedAt) : ''}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">This decision is final.</p>
                </div>
              ) : showCommentForm && targetStatus ? (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-foreground">Reject submission</div>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Explain why this is rejected…"
                    rows={4}
                    className="resize-none bg-background"
                  />
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <Checkbox id="decision-internal" checked={isInternal} onCheckedChange={(v) => setIsInternal(v as boolean)} />
                      <Label htmlFor="decision-internal" className="text-xs text-muted-foreground">Internal note</Label>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" disabled={submitting} onClick={cancelDecisionForm}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      variant="destructive"
                      disabled={submitting || !comment.trim()}
                      onClick={handleSubmit}
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Reject
                    </Button>
                  </div>
                </div>
              ) : isPending ? (
                <div className="space-y-2">
                  <Button className="w-full justify-center" disabled={submitting} onClick={handleStartReview}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                    Start review
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Move this {isIntervention ? 'intervention' : 'site'} into review to approve or reject it.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button className="w-full justify-center bg-emerald-600 text-white hover:bg-emerald-700" disabled={submitting} onClick={handleApprove}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-center border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    disabled={submitting}
                    onClick={() => openDecisionForm('rejected')}
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Need changes? Leave a comment in the discussion instead.
                  </p>
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details</h3>
              <dl className="space-y-2.5">
                {detailRows.map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-3 text-sm">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="max-w-[180px] truncate text-right font-medium text-foreground/90">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* History */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">History</h3>
              {intervention.history && intervention.history.length > 0 ? (
                <ol className="space-y-3">
                  {intervention.history.map((entry) => (
                    <li key={entry.uid} className="flex gap-3">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/40" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">{titleCase(entry.action)}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.userName}{entry.timestamp ? ` · ${relativeTime(entry.timestamp)}` : ''}
                        </div>
                        {entry.comment && <p className="mt-0.5 text-xs italic text-foreground/70">“{entry.comment}”</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <ol className="space-y-3">
                  {intervention.submittedForReviewAt && (
                    <li className="flex gap-3">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-400" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Submitted for review</div>
                        <div className="text-xs text-muted-foreground">{creator} · {relativeTime(intervention.submittedForReviewAt)}</div>
                      </div>
                    </li>
                  )}
                  {intervention.approvedBy && (
                    <li className="flex gap-3">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-400" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Assigned to reviewer</div>
                        <div className="text-xs text-muted-foreground">{intervention.approvedBy.name}</div>
                      </div>
                    </li>
                  )}
                  {!intervention.submittedForReviewAt && !intervention.approvedBy && (
                    <p className="text-sm text-muted-foreground">No history yet.</p>
                  )}
                </ol>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
