'use client';

import React, { useEffect, useState } from 'react';
import {
  ApprovalBoardColumn,
  ApprovalStatus,
  InterventionApprovalData,
} from '@shared-core/types/approval.types';
import { ApprovalColumn } from './ApprovalColumn';
import { ApprovalModal } from './ApprovalModal';
import useApprovalStore from '@shared-core/store/useApprovalStore';
import {
  getApprovalBoard,
  moveInterventionStatus,
  addApprovalComment,
} from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApprovalBoardProps {
  projectId: string;
  userRole: string;
}

export const ApprovalBoard: React.FC<ApprovalBoardProps> = ({
  projectId,
  userRole,
}) => {
  const { accessToken } = useToken();
  const {
    approvals,
    selectedApproval,
    loading,
    error,
    setApprovals,
    selectApproval,
    updateApproval,
    updateApprovalStatus,
    setLoading,
    setError,
  } = useApprovalStore();

  const [columns, setColumns] = useState<ApprovalBoardColumn[]>([
    {
      status: 'new_request',
      title: 'New Requests',
      interventions: [],
      color: '#F59E0B',
      badgeColor: 'bg-amber-500',
    },
    {
      status: 'in_review',
      title: 'In Review',
      interventions: [],
      color: '#3B82F6',
      badgeColor: 'bg-blue-500',
    },
    {
      status: 'approved',
      title: 'Approved',
      interventions: [],
      color: '#10B981',
      badgeColor: 'bg-green-500',
    },
    {
      status: 'rejected',
      title: 'Rejected',
      interventions: [],
      color: '#EF4444',
      badgeColor: 'bg-red-500',
    },
  ]);

  const isAdmin = userRole === 'owner' || userRole === 'admin';

  useEffect(() => {
    if (projectId && accessToken) {
      loadApprovals();
    }
  }, [projectId, accessToken]);

  useEffect(() => {
    // Organize approvals into columns
    const updatedColumns = columns.map((col) => ({
      ...col,
      interventions: approvals.filter(
        (approval) => approval.approvalStatus === col.status
      ),
    }));
    setColumns(updatedColumns);
  }, [approvals]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getApprovalBoard(accessToken, projectId);

      if (response.statusCode === 200) {
        setApprovals(response.data || []);
      } else {
        setError('Failed to load approvals');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (interventionId: number) => {
    const intervention = approvals.find(
      (a) => a.interventionId === interventionId
    );
    if (intervention) {
      selectApproval(intervention);
    }
  };

  const handleStatusChange = async (
    newStatus: ApprovalStatus,
    comment: string,
    isInternal: boolean
  ) => {
    if (!selectedApproval) return;

    try {
      // Optimistic update
      updateApprovalStatus(selectedApproval.interventionId, newStatus);

      const response = await moveInterventionStatus(accessToken, {
        interventionId: selectedApproval.interventionId,
        newStatus,
        comment: comment || undefined,
        isInternal,
      });

      if (response.statusCode === 200) {
        updateApproval(response.data);
        selectApproval(null);
      } else {
        // Revert on error
        await loadApprovals();
        setError('Failed to update status');
      }
    } catch (err: any) {
      // Revert on error
      await loadApprovals();
      setError(err.message || 'Failed to update status');
    }
  };

  const handleCommentAdd = async (comment: string, isInternal: boolean) => {
    if (!selectedApproval) return;

    try {
      const response = await addApprovalComment(accessToken, {
        interventionId: selectedApproval.interventionId,
        comment,
        isInternal,
      });

      if (response.statusCode === 200) {
        updateApproval(response.data);
        selectApproval(null);
      } else {
        setError('Failed to add comment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#007A49]" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <ApprovalColumn
            key={column.status}
            column={column}
            onCardClick={handleCardClick}
          />
        ))}
      </div>

      <ApprovalModal
        intervention={selectedApproval}
        isOpen={!!selectedApproval}
        isAdmin={isAdmin}
        onClose={() => selectApproval(null)}
        onStatusChange={handleStatusChange}
        onCommentAdd={handleCommentAdd}
      />
    </>
  );
};
