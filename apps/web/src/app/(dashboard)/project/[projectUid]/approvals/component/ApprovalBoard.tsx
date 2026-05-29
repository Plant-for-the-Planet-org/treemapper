'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ApprovalBoardColumn,
  ApprovalStatus,
  InterventionApprovalData,
  SiteApprovalData,
  ApprovalEntityType,
  isInterventionApproval,
  isSiteApproval,
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
  getSiteReviewQueue,
  submitSiteReviewDecision,
  addAdminSiteComment,
  addFieldWorkerSiteComment,
  getCurrentSiteThread,
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
import { SiteApprovalCard } from './SiteApprovalCard';

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
    sites,
    selectedApproval,
    loading,
    setApprovals,
    setSites,
    selectApproval,
    setLoading,
  } = useApprovalStore();

  const [entityType, setEntityType] = useState<ApprovalEntityType>('intervention');
  const [columns, setColumns] = useState<ApprovalBoardColumn[]>([]);
  const [activeIntervention, setActiveIntervention] =
    useState<InterventionApprovalData | null>(null);
  const [activeSite, setActiveSite] = useState<SiteApprovalData | null>(null);

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
      loadSites();
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

      const sitesList = sites.filter((site) => {
        if (!site.reviewStatus) return false;
        return columnReviewStatuses.includes(site.reviewStatus) && matchesSearch(site);
      });

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
              totalTreeCount: item.totalTreeCount || 0,
              totalSampleTreeCount: item.totalSampleTreeCount || 0,
              speciesCount: item.speciesCount || 0,
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
      } else {
        toast.error(response.message || 'Failed to load approvals');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const loadSites = async () => {
    try {
      const response = await getSiteReviewQueue(accessToken, projectId, { limit: 100, page: 1 });
      if (response.statusCode === 200 && response.data) {
        const mappedSites: SiteApprovalData[] = response.data.data.map((item: any) => ({
          siteId: item.siteId,
          siteUid: item.siteUid,
          name: item.siteName || '',
          description: item.description || null,
          createdBy: { id: item.userId, name: item.userName, email: '' },
          approvalStatus: mapReviewStatusToLegacyStatus(item.reviewStatus),
          reviewStatus: item.reviewStatus,
          currentThreadId: item.currentThreadId,
          submittedForReviewAt: null,
          approvedAt: null,
          rejectedAt: null,
          approvedBy: null,
          comments: [],
          history: [],
          siteData: {
            location: item.location || null,
            area: item.area || null,
            status: item.status || 'barren',
            soilType: null,
            elevation: null,
            slope: null,
            waterAccess: false,
            accessibility: null,
            plannedPlantingDate: null,
            actualPlantingDate: null,
            expectedTreeCount: null,
            image: null,
            createdAt: item.createdAt || '',
            updatedAt: item.updatedAt || '',
          },
        }));
        setSites(mappedSites);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load sites');
    }
  };

  const handleCardClick = (id: number) => {
    if (entityType === 'intervention') {
      const intervention = approvals.find((a) => a.interventionId === id);
      if (intervention) selectApproval(intervention);
    } else {
      const site = sites.find((s) => s.siteId === id);
      if (site) selectApproval(site);
    }
  };

  const handleStatusChange = async (
    newStatus: ApprovalStatus,
    comment: string,
    _isInternal: boolean
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

  const handleCommentAdd = async (comment: string, _isInternal: boolean) => {
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

  const handleSiteStatusChange = async (
    newStatus: ApprovalStatus,
    comment: string,
    _isInternal: boolean
  ) => {
    if (!selectedApproval || !isSiteApproval(selectedApproval)) return;
    const decision = mapColumnStatusToDecision(newStatus);
    if (!decision) {
      toast.error('Cannot move to this status');
      return;
    }
    try {
      setLoading(true);
      const response = await submitSiteReviewDecision(
        accessToken,
        projectId,
        selectedApproval.siteUid,
        { decision: decision as 'in_review' | 'approved' | 'rejected', note: comment || undefined }
      );
      if (response.statusCode === 200 || response.statusCode === 201) {
        await loadSites();
        selectApproval(null);
      } else {
        toast.error(response.message || 'Failed to update site status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update site status');
    } finally {
      setLoading(false);
    }
  };

  const handleSiteCommentAdd = async (comment: string, _isInternal: boolean) => {
    if (!selectedApproval || !isSiteApproval(selectedApproval)) return;
    try {
      setLoading(true);
      const commentDto = { type: 'general' as const, message: comment };
      let response;
      if (isAdmin) {
        response = await addAdminSiteComment(accessToken, projectId, selectedApproval.siteUid, commentDto);
      } else {
        response = await addFieldWorkerSiteComment(accessToken, selectedApproval.siteUid, commentDto);
      }
      if (response.statusCode === 200 || response.statusCode === 201) {
        await loadSites();
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
    const activeId = Number(active.id);

    if (entityType === 'intervention') {
      const intervention = approvals.find((a) => a.interventionId === activeId);
      if (intervention) {
        setActiveIntervention(intervention);
        dragOriginalColumnRef.current = mapReviewStatusToLegacyStatus(
          intervention.reviewStatus || 'pending'
        );
      }
    } else {
      const site = sites.find((s) => s.siteId === activeId);
      if (site) {
        setActiveSite(site);
        dragOriginalColumnRef.current = mapReviewStatusToLegacyStatus(
          site.reviewStatus || 'pending'
        );
      }
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
    setActiveSite(null);
    dragOriginalColumnRef.current = null;

    if (!over || !originalColumn) return;

    const activeId = Number(active.id);
    const overId = over.id;

    // Determine target column
    let targetColumnStatus: ApprovalStatus | null = null;
    const overCol = COLUMN_DEFINITIONS.find((col) => col.status === overId);
    if (overCol) {
      targetColumnStatus = overCol.status;
    } else if (entityType === 'intervention') {
      const overIntervention = approvals.find((a) => a.interventionId === Number(overId));
      if (overIntervention?.reviewStatus) {
        targetColumnStatus = mapReviewStatusToLegacyStatus(overIntervention.reviewStatus);
      }
    } else {
      const overSite = sites.find((s) => s.siteId === Number(overId));
      if (overSite?.reviewStatus) {
        targetColumnStatus = mapReviewStatusToLegacyStatus(overSite.reviewStatus);
      }
    }

    if (!targetColumnStatus || targetColumnStatus === originalColumn) return;

    const decision = mapColumnStatusToDecision(targetColumnStatus);
    if (!decision) {
      toast.error('Cannot move items back to New Requests');
      return;
    }

    try {
      setLoading(true);

      if (entityType === 'intervention') {
        const intervention = approvals.find((a) => a.interventionId === activeId);
        if (!intervention) return;
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
      } else {
        const site = sites.find((s) => s.siteId === activeId);
        if (!site) return;
        const response = await submitSiteReviewDecision(
          accessToken,
          projectId,
          site.siteUid,
          { decision: decision as 'in_review' | 'approved' | 'rejected' }
        );
        if (response.statusCode === 200 || response.statusCode === 201) {
          await loadSites();
        } else {
          toast.error(response.message || 'Failed to update site status');
        }
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Entity Type Filter */}
      <div className="mb-5 flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Show:</span>
        <div className="flex gap-2">
          <Button
            variant={entityType === 'intervention' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEntityType('intervention')}
          >
            Interventions ({approvals.length})
          </Button>
          <Button
            variant={entityType === 'site' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEntityType('site')}
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
            <ApprovalCard intervention={activeIntervention} onClick={() => {}} isDragging />
          ) : activeSite ? (
            <SiteApprovalCard site={activeSite} onClick={() => {}} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      <ApprovalModal
        intervention={selectedApproval}
        isOpen={!!selectedApproval}
        isAdmin={isAdmin}
        onClose={() => selectApproval(null)}
        onStatusChange={selectedApproval && isSiteApproval(selectedApproval) ? handleSiteStatusChange : handleStatusChange}
        onCommentAdd={selectedApproval && isSiteApproval(selectedApproval) ? handleSiteCommentAdd : handleCommentAdd}
      />
    </>
  );
};
