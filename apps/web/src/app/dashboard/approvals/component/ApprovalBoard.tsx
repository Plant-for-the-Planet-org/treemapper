'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ApprovalBoardColumn,
  ApprovalStatus,
  InterventionApprovalData,
  SiteApprovalData,
  ApprovalEntityType,
  isInterventionApproval,
  mapReviewStatusToLegacyStatus,
  ReviewDecision,
  ReviewStatus,
} from '@shared-core/types/approval.types';
import { ApprovalColumn } from './ApprovalColumn';
import { ApprovalModal } from './ApprovalModal';
import useApprovalStore from '@shared-core/store/useApprovalStore';
import {
  getReviewQueue,
  submitReviewDecision,
  addAdminComment,
  addFieldWorkerComment,
  getCurrentThread,
} from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { ApprovalCard } from './ApprovalCard';

interface ApprovalBoardProps {
  projectId: string;
  userRole: string;
  searchQuery?: string;
}

// Map a column's legacy status to a review decision for the API
function mapColumnStatusToDecision(columnStatus: ApprovalStatus): ReviewDecision | null {
  switch (columnStatus) {
    case 'in_review':
      return 'in_review';
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'rejected';
    default:
      return null; // 'new_request' - can't move items here via API
  }
}

// Column definitions
const COLUMN_DEFINITIONS: Omit<ApprovalBoardColumn, 'interventions' | 'sites' | 'items'>[] = [
  {
    status: 'new_request',
    reviewStatus: ['draft', 'pending'],
    title: 'New Requests',
    color: '#F59E0B',
    badgeColor: 'bg-amber-500',
  },
  {
    status: 'in_review',
    reviewStatus: ['in_review', 'changes_requested', 'in_revision', 'resubmitted'],
    title: 'In Review',
    color: '#3B82F6',
    badgeColor: 'bg-blue-500',
  },
  {
    status: 'approved',
    reviewStatus: ['approved', 'published'],
    title: 'Approved',
    color: '#10B981',
    badgeColor: 'bg-green-500',
  },
  {
    status: 'rejected',
    reviewStatus: ['rejected', 'unpublished'],
    title: 'Rejected',
    color: '#EF4444',
    badgeColor: 'bg-red-500',
  },
];

export const ApprovalBoard: React.FC<ApprovalBoardProps> = ({
  projectId,
  userRole,
  searchQuery = '',
}) => {
  const { accessToken } = useToken();
  const {
    approvals,
    selectedApproval,
    loading,
    setApprovals,
    selectApproval,
    setLoading,
  } = useApprovalStore();

  const [entityType, setEntityType] = useState<ApprovalEntityType>('intervention');
  const [sites, setSites] = useState<SiteApprovalData[]>([]);
  const [columns, setColumns] = useState<ApprovalBoardColumn[]>([]);
  const [activeIntervention, setActiveIntervention] =
    useState<InterventionApprovalData | null>(null);

  // Store the original column when drag starts, so we can compare on drop
  const dragOriginalColumnRef = useRef<ApprovalStatus | null>(null);

  const isAdmin = userRole === 'owner' || userRole === 'admin';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (projectId && accessToken) {
      loadApprovals();
    }
  }, [projectId, accessToken]);

  // Organize approvals into columns using reviewStatus only (single source of truth)
  useEffect(() => {
    const matchesSearch = (item: InterventionApprovalData | SiteApprovalData): boolean => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const matchesCreator =
        item.createdBy.name.toLowerCase().includes(query) ||
        item.createdBy.email.toLowerCase().includes(query);

      if (isInterventionApproval(item)) {
        return (
          item.interventionHid.toLowerCase().includes(query) ||
          item.interventionUid.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query) ||
          (item.interventionData.description?.toLowerCase().includes(query) || false) ||
          matchesCreator
        );
      } else {
        return (
          item.siteUid.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query) ||
          (item.description?.toLowerCase().includes(query) || false) ||
          matchesCreator
        );
      }
    };

    const updatedColumns: ApprovalBoardColumn[] = COLUMN_DEFINITIONS.map((col) => {
      const columnReviewStatuses = col.reviewStatus as ReviewStatus[];

      // Use reviewStatus as the sole source of truth for column assignment
      const interventions = approvals.filter((approval) => {
        if (!approval.reviewStatus) return false;
        return columnReviewStatuses.includes(approval.reviewStatus) && matchesSearch(approval);
      });

      const sitesList = sites.filter(
        (site) => site.approvalStatus === col.status && matchesSearch(site)
      );

      return {
        ...col,
        interventions,
        sites: sitesList,
        items: entityType === 'intervention' ? interventions : sitesList,
      };
    });

    setColumns(updatedColumns);
  }, [approvals, sites, entityType, searchQuery]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      toast.error(null);

      // Fetch all submitted interventions (backend returns all statuses except draft by default)
      const response = await getReviewQueue(accessToken, projectId, {
        limit: 100,
        page: 1,
      });

      if (response.statusCode === 200 && response.data) {
        const mappedInterventions: InterventionApprovalData[] = response.data.data.map(
          (item: any) => ({
            interventionId: item.interventionId,
            interventionUid: item.interventionUid,
            interventionHid: item.interventionHid,
            type: item.type,
            createdBy: {
              id: item.userId,
              name: item.userName,
              email: '',
            },
            approvalStatus: mapReviewStatusToLegacyStatus(item.reviewStatus),
            reviewStatus: item.reviewStatus,
            submittedForReviewAt: item.submittedAt
              ? new Date(item.submittedAt).toISOString()
              : null,
            approvedAt: null,
            rejectedAt: null,
            approvedBy: null,
            comments: [],
            reviewComments: [],
            reviewThreads: [],
            history: [],
            interventionData: {
              description: item.interventionName || '',
              location: null,
              area: 0,
              totalTreeCount: 0,
              registrationDate: '',
              interventionStartDate: '',
              interventionEndDate: '',
              image: null,
            },
            unresolvedIssuesCount: item.unresolvedIssuesCount || 0,
            revisionCount: item.revisionCount || 0,
            currentThreadId: item.currentThreadId,
          })
        );

        setApprovals(mappedInterventions);
        setSites([]);
      } else {
        toast.error(response.message || 'Failed to load approvals');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (id: number) => {
    if (entityType === 'intervention') {
      const intervention = approvals.find((a) => a.interventionId === id);
      if (intervention) {
        selectApproval(intervention);
      }
    } else {
      const site = sites.find((s) => s.siteId === id);
      if (site) {
        selectApproval(site as any);
      }
    }
  };

  const handleStatusChange = async (
    newStatus: ApprovalStatus,
    comment: string,
    isInternal: boolean
  ) => {
    if (!selectedApproval || !isInterventionApproval(selectedApproval)) return;

    const decision = mapColumnStatusToDecision(newStatus);
    if (!decision) {
      toast.error('Cannot move to this status');
      return;
    }

    try {
      setLoading(true);

      const response = await submitReviewDecision(
        accessToken,
        projectId,
        selectedApproval.interventionUid,
        {
          decision: decision as 'approved' | 'rejected' | 'changes_requested',
          note: comment || undefined,
          issues:
            comment && decision === 'changes_requested'
              ? [{ field: 'general', severity: 'suggestion' as const, message: comment }]
              : undefined,
        }
      );

      if (response.statusCode === 200 || response.statusCode === 201) {
        await loadApprovals();
        selectApproval(null);
      } else {
        toast.error(response.message || 'Failed to update status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdd = async (comment: string, isInternal: boolean) => {
    if (!selectedApproval || !isInterventionApproval(selectedApproval)) return;

    try {
      setLoading(true);

      // Get current thread UID
      let threadUid: string | undefined;

      const currentThreadResponse = await getCurrentThread(
        accessToken,
        selectedApproval.interventionUid
      );
      if (currentThreadResponse.statusCode === 200 && currentThreadResponse.data) {
        threadUid = currentThreadResponse.data.uid;
      }

      if (!threadUid) {
        toast.error('No active review thread found.');
        return;
      }

      const commentDto = {
        type: 'general' as const,
        message: comment,
      };

      let response;
      if (isAdmin) {
        response = await addAdminComment(accessToken, projectId, threadUid, commentDto);
      } else {
        response = await addFieldWorkerComment(accessToken, threadUid, commentDto);
      }

      if (response.statusCode === 200 || response.statusCode === 201) {
        await loadApprovals();
        selectApproval(null);
      } else {
        toast.error(response.message || 'Failed to add comment');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  // === Drag and Drop Handlers ===

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const intervention = approvals.find(
      (a) => a.interventionId === Number(active.id)
    );
    if (intervention) {
      setActiveIntervention(intervention);
      // Store original column so we can detect cross-column drops
      dragOriginalColumnRef.current = mapReviewStatusToLegacyStatus(
        intervention.reviewStatus || 'pending'
      );
    }
  };

  // No handleDragOver: we do NOT mutate store state during drag.
  // DragOverlay provides visual feedback for the dragged card.
  // The droppable zone highlights via isOver in ApprovalColumn.

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const originalColumn = dragOriginalColumnRef.current;

    // Reset drag state
    setActiveIntervention(null);
    dragOriginalColumnRef.current = null;

    if (!over || !originalColumn) return;

    const activeId = Number(active.id);
    const overId = over.id;

    const intervention = approvals.find((a) => a.interventionId === activeId);
    if (!intervention) return;

    // Determine target column
    let targetColumnStatus: ApprovalStatus | null = null;

    // Check if dropped directly on a column
    const overCol = COLUMN_DEFINITIONS.find((col) => col.status === overId);
    if (overCol) {
      targetColumnStatus = overCol.status;
    } else {
      // Dropped on a card - find which column that card belongs to
      const overIntervention = approvals.find(
        (a) => a.interventionId === Number(overId)
      );
      if (overIntervention?.reviewStatus) {
        targetColumnStatus = mapReviewStatusToLegacyStatus(overIntervention.reviewStatus);
      }
    }

    // If no target or same column, nothing to do
    if (!targetColumnStatus || targetColumnStatus === originalColumn) return;

    // Map target column to API decision
    const decision = mapColumnStatusToDecision(targetColumnStatus);
    if (!decision) {
      toast.error('Cannot move items back to New Requests');
      return;
    }

    try {
      setLoading(true);
      const response = await submitReviewDecision(
        accessToken,
        projectId,
        intervention.interventionUid,
        { decision: decision as 'approved' | 'rejected' | 'changes_requested' }
      );

      if (response.statusCode === 200 || response.statusCode === 201) {
        await loadApprovals();
      } else {
        toast.error(response.message || 'Failed to update status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#007A49]" />
      </div>
    );
  }

  return (
    <>
      {/* Entity Type Filter */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Show:</span>
        <div className="flex gap-2">
          <Button
            variant={entityType === 'intervention' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEntityType('intervention')}
            className={entityType === 'intervention' ? 'bg-[#007A49] hover:bg-[#006039]' : ''}
          >
            Interventions ({approvals.length})
          </Button>
          <Button
            variant={entityType === 'site' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEntityType('site')}
            className={entityType === 'site' ? 'bg-[#007A49] hover:bg-[#006039]' : ''}
          >
            Sites ({sites.length})
          </Button>
        </div>
      </div>

      <DndContext
        autoScroll={false}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <ApprovalColumn
              key={column.status}
              column={column}
              onCardClick={handleCardClick}
              entityType={entityType}
            />
          ))}
        </div>

        <DragOverlay>
          {activeIntervention ? (
            <ApprovalCard
              intervention={activeIntervention}
              onClick={() => {}}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

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
