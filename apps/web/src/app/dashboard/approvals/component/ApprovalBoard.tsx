'use client';

import React, { useEffect, useState } from 'react';
import {
  ApprovalBoardColumn,
  ApprovalStatus,
  InterventionApprovalData,
  SiteApprovalData,
  ApprovalEntityType,
  isInterventionApproval,
  mapReviewStatusToLegacyStatus,
  ReviewDecision,
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
  getInterventionThreads,
} from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
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
    error,
    setApprovals,
    selectApproval,
    setLoading,
    setError,
  } = useApprovalStore();

  const [entityType, setEntityType] = useState<ApprovalEntityType>('intervention');
  const [sites, setSites] = useState<SiteApprovalData[]>([]);

  const [columns, setColumns] = useState<ApprovalBoardColumn[]>([
    {
      status: 'new_request',
      reviewStatus: ['draft', 'pending'],
      title: 'New Requests',
      interventions: [],
      sites: [],
      items: [],
      color: '#F59E0B',
      badgeColor: 'bg-amber-500',
    },
    {
      status: 'in_review',
      reviewStatus: ['in_review', 'changes_requested', 'in_revision', 'resubmitted'],
      title: 'In Review',
      interventions: [],
      sites: [],
      items: [],
      color: '#3B82F6',
      badgeColor: 'bg-blue-500',
    },
    {
      status: 'approved',
      reviewStatus: ['approved', 'published'],
      title: 'Approved',
      interventions: [],
      sites: [],
      items: [],
      color: '#10B981',
      badgeColor: 'bg-green-500',
    },
    {
      status: 'rejected',
      reviewStatus: ['rejected', 'unpublished'],
      title: 'Rejected',
      interventions: [],
      sites: [],
      items: [],
      color: '#EF4444',
      badgeColor: 'bg-red-500',
    },
  ]);

  const [activeIntervention, setActiveIntervention] =
    useState<InterventionApprovalData | null>(null);

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

  useEffect(() => {
    // Filter function for search
    const matchesSearch = (item: InterventionApprovalData | SiteApprovalData): boolean => {
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();

      // Common fields
      const matchesCreator = item.createdBy.name.toLowerCase().includes(query) ||
                            item.createdBy.email.toLowerCase().includes(query);

      if (isInterventionApproval(item)) {
        // Search in intervention-specific fields
        return (
          item.interventionHid.toLowerCase().includes(query) ||
          item.interventionUid.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query) ||
          (item.interventionData.description?.toLowerCase().includes(query) || false) ||
          matchesCreator
        );
      } else {
        // Search in site-specific fields
        return (
          item.siteUid.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query) ||
          (item.description?.toLowerCase().includes(query) || false) ||
          matchesCreator ||
          (item.siteData.soilType?.toLowerCase().includes(query) || false) ||
          (item.siteData.accessibility?.toLowerCase().includes(query) || false)
        );
      }
    };

    // Organize approvals into columns based on entity type and search
    const updatedColumns = columns.map((col) => {
      const interventions = approvals.filter((approval) => {
        // Check if intervention matches column by legacy status or review status
        const matchesStatus =
          approval.approvalStatus === col.status ||
          (approval.reviewStatus &&
            Array.isArray(col.reviewStatus) &&
            col.reviewStatus.includes(approval.reviewStatus));
        return matchesStatus && matchesSearch(approval);
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
      setError(null);

      console.log('Loading approvals for project:', projectId, 'isAdmin:', isAdmin);

      if (!isAdmin) {
        // For non-admins, they can view their own interventions
        // For now, show empty state - can be enhanced later with user-specific endpoint
        console.log('User is not admin, showing empty state');
        setApprovals([]);
        setSites([]);
        setLoading(false);
        return;
      }

      // Fetch review queue for admins
      console.log('Fetching review queue...');
      const response = await getReviewQueue(accessToken, projectId, {
        limit: 100,
        page: 1,
      });

      console.log('Review queue response:', response);

      if (response.statusCode === 200 && response.data) {
        // Map backend InterventionReviewSummary to InterventionApprovalData
        const mappedInterventions: InterventionApprovalData[] = response.data.data.map(
          (item: any) => ({
            interventionId: item.interventionId,
            interventionUid: item.interventionUid,
            interventionHid: item.interventionHid,
            type: item.type,
            createdBy: {
              id: item.userId,
              name: item.userName,
              email: '', // Not provided in summary
            },
            approvalStatus: mapReviewStatusToLegacyStatus(item.reviewStatus),
            reviewStatus: item.reviewStatus,
            submittedForReviewAt: item.submittedAt
              ? new Date(item.submittedAt).toISOString()
              : null,
            approvedAt: null, // Will be populated from details if needed
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
        setSites([]); // Sites not yet supported in new API
      } else {
        setError(response.message || 'Failed to load approvals');
      }
    } catch (err: any) {
      console.error('Error loading approvals:', err);
      setError(err.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (id: number) => {
    if (entityType === 'intervention') {
      const intervention = approvals.find(
        (a) => a.interventionId === id
      );
      if (intervention) {
        selectApproval(intervention);
      }
    } else {
      const site = sites.find(
        (s) => s.siteId === id
      );
      if (site) {
        selectApproval(site);
      }
    }
  };

  const handleStatusChange = async (
    newStatus: ApprovalStatus,
    comment: string,
    isInternal: boolean
  ) => {
    if (!selectedApproval || !isInterventionApproval(selectedApproval)) return;

    try {
      setLoading(true);

      // Map legacy status to review decision
      let decision: ReviewDecision;
      if (newStatus === 'approved') {
        decision = 'approved';
      } else if (newStatus === 'rejected') {
        decision = 'rejected';
      } else {
        decision = 'changes_requested';
      }

      // Submit review decision
      const response = await submitReviewDecision(
        accessToken,
        projectId,
        selectedApproval.interventionUid,
        {
          decision,
          note: comment || undefined,
          issues: comment
            ? [
                {
                  field: 'general',
                  severity: 'suggestion' as const,
                  message: comment,
                },
              ]
            : undefined,
        }
      );

      if (response.statusCode === 200 || response.statusCode === 201) {
        // Reload approvals to get updated data
        await loadApprovals();
        selectApproval(null);
      } else {
        setError(response.message || 'Failed to update status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdd = async (comment: string, isInternal: boolean) => {
    if (!selectedApproval || !isInterventionApproval(selectedApproval)) return;

    try {
      setLoading(true);

      // Get or create current thread
      let threadUid: string;
      if (selectedApproval.currentThreadId) {
        // Get thread details to get threadUid
        const threadsResponse = await getInterventionThreads(
          accessToken,
          selectedApproval.interventionUid
        );
        if (
          threadsResponse.statusCode === 200 &&
          threadsResponse.data?.data?.length > 0
        ) {
          const currentThread = threadsResponse.data.data.find(
            (t: any) => t.id === selectedApproval.currentThreadId
          );
          threadUid = currentThread?.uid;
        } else {
          // Fallback: get current thread
          const currentThreadResponse = await getCurrentThread(
            accessToken,
            selectedApproval.interventionUid
          );
          if (currentThreadResponse.statusCode === 200 && currentThreadResponse.data) {
            threadUid = currentThreadResponse.data.uid;
          } else {
            throw new Error('No active review thread found');
          }
        }
      } else {
        throw new Error('No active review thread found. Please submit for review first.');
      }

      if (!threadUid) {
        throw new Error('Could not find thread UID');
      }

      // Add comment based on user role
      const commentDto = {
        type: 'general' as const,
        message: comment,
        severity: undefined as any,
      };

      let response;
      if (isAdmin) {
        response = await addAdminComment(
          accessToken,
          projectId,
          threadUid,
          commentDto
        );
      } else {
        response = await addFieldWorkerComment(accessToken, threadUid, commentDto);
      }

      if (response.statusCode === 200 || response.statusCode === 201) {
        // Reload intervention details to get updated comments
        const detailsResponse = await getInterventionReviewDetails(
          accessToken,
          selectedApproval.interventionUid
        );
        if (detailsResponse.statusCode === 200) {
          // Update the approval with new data
          await loadApprovals();
        }
        selectApproval(null);
      } else {
        setError(response.message || 'Failed to add comment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const intervention = approvals.find(
      (a) => a.interventionId === Number(active.id)
    );
    if (intervention) {
      setActiveIntervention(intervention);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = Number(active.id);
    const overId = over.id;

    const activeIntervention = approvals.find(
      (a) => a.interventionId === activeId
    );
    if (!activeIntervention) return;

    // Check if we're dragging over a column droppable zone
    const overColumn = columns.find((col) => col.status === overId);
    if (overColumn) {
      if (activeIntervention.approvalStatus !== overColumn.status) {
        // Move intervention to the new column
        const updatedApprovals = approvals.map((approval) =>
          approval.interventionId === activeId
            ? { ...approval, approvalStatus: overColumn.status }
            : approval
        );
        setApprovals(updatedApprovals);
      }
      return;
    }

    // Check if we're dragging over another intervention card
    const overIntervention = approvals.find(
      (a) => a.interventionId === Number(overId)
    );

    if (overIntervention) {
      // If the over intervention is in a different column, move to that column
      if (activeIntervention.approvalStatus !== overIntervention.approvalStatus) {
        const updatedApprovals = approvals.map((approval) =>
          approval.interventionId === activeId
            ? { ...approval, approvalStatus: overIntervention.approvalStatus }
            : approval
        );
        setApprovals(updatedApprovals);
      } else {
        // Same column - reorder
        const oldIndex = approvals.findIndex((a) => a.interventionId === activeId);
        const newIndex = approvals.findIndex(
          (a) => a.interventionId === Number(overId)
        );

        if (oldIndex !== newIndex) {
          const reorderedApprovals = arrayMove(approvals, oldIndex, newIndex);
          setApprovals(reorderedApprovals);
        }
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIntervention(null);

    if (!over) return;

    const activeId = Number(active.id);
    const overId = over.id;

    const activeIntervention = approvals.find(
      (a) => a.interventionId === activeId
    );
    if (!activeIntervention) return;

    // Check if dropped on a column
    const overColumn = columns.find((col) => col.status === overId);
    if (overColumn && activeIntervention.approvalStatus !== overColumn.status) {
      // Map legacy status to review decision
      let decision: ReviewDecision;
      if (overColumn.status === 'approved') {
        decision = 'approved';
      } else if (overColumn.status === 'rejected') {
        decision = 'rejected';
      } else {
        decision = 'changes_requested';
      }

      try {
        await submitReviewDecision(
          accessToken,
          projectId,
          activeIntervention.interventionUid,
          {
            decision,
          }
        );
        await loadApprovals();
      } catch (err: any) {
        setError(err.message || 'Failed to update status');
      }
      return;
    }

    // Check if dropped on another intervention in a different column
    const overIntervention = approvals.find(
      (a) => a.interventionId === Number(overId)
    );
    if (
      overIntervention &&
      activeIntervention.approvalStatus !== overIntervention.approvalStatus
    ) {
      // Map legacy status to review decision
      let decision: ReviewDecision;
      if (overIntervention.approvalStatus === 'approved') {
        decision = 'approved';
      } else if (overIntervention.approvalStatus === 'rejected') {
        decision = 'rejected';
      } else {
        decision = 'changes_requested';
      }

      try {
        await submitReviewDecision(
          accessToken,
          projectId,
          activeIntervention.interventionUid,
          {
            decision,
          }
        );
        await loadApprovals();
      } catch (err: any) {
        setError(err.message || 'Failed to update status');
      }
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
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
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
