'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { Check, Loader2, X } from 'lucide-react';
import { reviewSpeciesRequest } from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import type { SpeciesRequest } from '../types';
import { Badge, Button, Input, Modal, Textarea } from './workspace-ui';

interface SpeciesReviewModalProps {
  request: SpeciesRequest;
  canReview: boolean;
  onClose: () => void;
  onReviewed: () => void;
}

const STATUS_LABEL: Record<SpeciesRequest['status'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function SpeciesReviewModal({ request, canReview, onClose, onReviewed }: SpeciesReviewModalProps) {
  const { accessToken } = useToken();
  const isPending = request.status === 'pending';

  const [fields, setFields] = useState({
    scientificName: request.scientificName || '',
    commonName: request.commonName || '',
    description: request.description || '',
    gbifId: request.gbifId || '',
  });
  const [adminNotes, setAdminNotes] = useState('');
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null);

  const update = (field: keyof typeof fields, value: string) =>
    setFields((prev) => ({ ...prev, [field]: value }));

  const submit = async (decision: 'approved' | 'rejected') => {
    if (!accessToken || !request.project?.uid) return;

    if (decision === 'rejected' && !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejecting this request');
      return;
    }
    if (decision === 'approved' && !fields.scientificName.trim()) {
      toast.error('Scientific name is required');
      return;
    }

    setSubmitting(decision === 'approved' ? 'approve' : 'reject');
    const res = await reviewSpeciesRequest(accessToken, request.project.uid, request.uid, {
      decision,
      scientificName: fields.scientificName.trim(),
      commonName: fields.commonName.trim() || undefined,
      description: fields.description.trim() || undefined,
      gbifId: fields.gbifId.trim() || undefined,
      adminNotes: adminNotes.trim() || undefined,
      rejectionReason: decision === 'rejected' ? rejectionReason.trim() : undefined,
    });
    setSubmitting(null);

    if (!res || res.error) {
      toast.error(res?.message || `Failed to ${decision === 'approved' ? 'approve' : 'reject'} request`);
      return;
    }

    toast.success(decision === 'approved' ? 'Species approved and added to the database' : 'Species request rejected');
    onReviewed();
  };

  return (
    <Modal isOpen onClose={onClose} title="Species Request">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant={request.status === 'approved' ? 'success' : request.status === 'rejected' ? 'destructive' : 'default'}>
            {STATUS_LABEL[request.status]}
          </Badge>
          <span className="text-xs text-gray-400">
            Requested {new Date(request.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600 space-y-1">
          <div><span className="font-medium text-gray-700">Requested by:</span> {request.requestedBy?.name || request.requestedBy?.email || 'Unknown'}</div>
          <div><span className="font-medium text-gray-700">Project:</span> {request.project?.projectName || '—'}</div>
          <div><span className="font-medium text-gray-700">Reason:</span> {request.requestReason}</div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Scientific name *</label>
          <Input
            value={fields.scientificName}
            onChange={(e) => update('scientificName', e.target.value)}
            disabled={!isPending || !canReview}
            className="italic"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Common name</label>
          <Input
            value={fields.commonName}
            onChange={(e) => update('commonName', e.target.value)}
            disabled={!isPending || !canReview}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Description</label>
          <Textarea
            value={fields.description}
            onChange={(e) => update('description', e.target.value)}
            disabled={!isPending || !canReview}
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">GBIF ID</label>
          <Input
            value={fields.gbifId}
            onChange={(e) => update('gbifId', e.target.value)}
            disabled={!isPending || !canReview}
          />
        </div>

        {isPending && canReview && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Admin notes (optional)</label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              placeholder="Internal notes about this decision..."
            />
          </div>
        )}

        {!isPending && (request.adminNotes || request.rejectionReason) && (
          <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600 space-y-1">
            {request.rejectionReason && (
              <div><span className="font-medium text-gray-700">Rejection reason:</span> {request.rejectionReason}</div>
            )}
            {request.adminNotes && (
              <div><span className="font-medium text-gray-700">Admin notes:</span> {request.adminNotes}</div>
            )}
            {request.reviewedAt && (
              <div><span className="font-medium text-gray-700">Reviewed:</span> {new Date(request.reviewedAt).toLocaleDateString()}</div>
            )}
          </div>
        )}

        {isPending && canReview && showRejectReason && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Reason for rejection *</label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
              placeholder="Why is this request being rejected?"
            />
          </div>
        )}

        {isPending && canReview ? (
          <div className="flex justify-end gap-2 pt-2">
            {showRejectReason ? (
              <>
                <Button variant="outline" onClick={() => setShowRejectReason(false)} disabled={!!submitting}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => submit('rejected')} disabled={!!submitting}>
                  {submitting === 'reject' ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <X size={14} className="mr-1.5" />}
                  Confirm rejection
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowRejectReason(true)} disabled={!!submitting}>
                  Reject
                </Button>
                <Button variant="primary" onClick={() => submit('approved')} disabled={!!submitting}>
                  {submitting === 'approve' ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Check size={14} className="mr-1.5" />}
                  Approve
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
