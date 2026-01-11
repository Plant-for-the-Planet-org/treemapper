'use client';

import React, { useState } from 'react';
import {
  InterventionApprovalData,
  ApprovalStatus,
  ApprovalHistoryEntry,
} from '@shared-core/types/approval.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import {
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
  User,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react';

interface ApprovalModalProps {
  intervention: InterventionApprovalData | null;
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onStatusChange: (
    newStatus: ApprovalStatus,
    comment: string,
    isInternal: boolean
  ) => void;
  onCommentAdd: (comment: string, isInternal: boolean) => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  intervention,
  isOpen,
  isAdmin,
  onClose,
  onStatusChange,
  onCommentAdd,
}) => {
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ApprovalStatus | null>(null);

  if (!intervention) return null;

  const formatType = (type: string) => {
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return date;
    }
  };

  const getHistoryActionText = (action: ApprovalHistoryEntry['action']) => {
    const icons = {
      submitted: '📝',
      moved_to_review: '👁️',
      approved: '✅',
      rejected: '❌',
      requested_revision: '🔄',
      resubmitted: '📤',
      data_edited: '✏️',
    };
    const text = action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    return `${icons[action] || ''} ${text}`;
  };

  const handleStatusClick = (newStatus: ApprovalStatus) => {
    setTargetStatus(newStatus);
    setShowCommentForm(true);
  };

  const handleSubmit = () => {
    if (targetStatus) {
      if (targetStatus === 'rejected' && !comment.trim()) {
        alert('Comment is required when rejecting');
        return;
      }
      onStatusChange(targetStatus, comment.trim(), isInternal);
    } else {
      if (!comment.trim()) return;
      onCommentAdd(comment.trim(), isInternal);
    }

    setComment('');
    setIsInternal(false);
    setShowCommentForm(false);
    setTargetStatus(null);
  };

  const canApprove = isAdmin && intervention.approvalStatus !== 'approved';
  const canReject = isAdmin && intervention.approvalStatus !== 'rejected';
  const canMoveToReview =
    isAdmin &&
    intervention.approvalStatus !== 'in_review' &&
    intervention.approvalStatus !== 'approved';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Intervention Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="text-sm font-bold text-[#007A49] mb-1">
              #{intervention.interventionHid}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {formatType(intervention.type)}
            </h2>
          </div>

          {/* Image */}
          {intervention.interventionData.image && (
            <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={intervention.interventionData.image}
                alt="Intervention"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Overview */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Overview</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Created by:</span>
                <span className="ml-2 font-semibold">
                  {intervention.createdBy.name}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-semibold">
                  {intervention.createdBy.email}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Tree Count:</span>
                <span className="ml-2 font-semibold">
                  {intervention.interventionData.totalTreeCount || 0}
                </span>
              </div>
              {intervention.interventionData.area && (
                <div>
                  <span className="text-gray-600">Area:</span>
                  <span className="ml-2 font-semibold">
                    {intervention.interventionData.area.toFixed(2)} m²
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-600">Registration Date:</span>
                <span className="ml-2 font-semibold">
                  {formatDate(intervention.interventionData.registrationDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {intervention.interventionData.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-sm text-gray-700">
                {intervention.interventionData.description}
              </p>
            </div>
          )}

          {/* Approval Info */}
          {intervention.approvedBy && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-green-800">
                ✓ Approved by {intervention.approvedBy.name}
              </div>
              {intervention.approvedAt && (
                <div className="text-xs text-green-700 mt-1">
                  on {formatDate(intervention.approvedAt)}
                </div>
              )}
            </div>
          )}

          {/* History */}
          {intervention.history && intervention.history.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">History</h3>
              <div className="space-y-2">
                {intervention.history.map((entry: ApprovalHistoryEntry) => (
                  <div
                    key={entry.uid}
                    className="bg-gray-50 rounded-lg p-3 text-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">
                        {getHistoryActionText(entry.action)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">{entry.userName}</div>
                    {entry.comment && (
                      <div className="text-xs text-gray-700 mt-2 italic">
                        "{entry.comment}"
                      </div>
                    )}
                    {entry.changedFields && entry.changedFields.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Changed: {entry.changedFields.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comment Form */}
          {showCommentForm && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">
                {targetStatus
                  ? `Change Status to ${targetStatus.replace('_', ' ')}`
                  : 'Add Comment'}
              </h3>

              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add your comment here..."
                className="mb-3"
                rows={4}
              />

              {isAdmin && (
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id="internal"
                    checked={isInternal}
                    onCheckedChange={(checked) =>
                      setIsInternal(checked as boolean)
                    }
                  />
                  <Label htmlFor="internal" className="text-sm">
                    Internal Comment (only visible to admins and owners)
                  </Label>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCommentForm(false);
                    setTargetStatus(null);
                    setComment('');
                    setIsInternal(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={targetStatus === 'rejected' && !comment.trim()}
                >
                  Submit
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          {!showCommentForm && (
            <div className="border-t pt-4 space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCommentForm(true)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Comment
              </Button>

              {isAdmin && (
                <div className="grid grid-cols-3 gap-2">
                  {canMoveToReview && (
                    <Button
                      onClick={() => handleStatusClick('in_review')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  )}
                  {canApprove && (
                    <Button
                      onClick={() => handleStatusClick('approved')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  {canReject && (
                    <Button
                      onClick={() => handleStatusClick('rejected')}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
