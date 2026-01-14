'use client';

import React, { useEffect, useState } from 'react';
import {
  ApprovalBoardColumn,
  ApprovalStatus,
  InterventionApprovalData,
  SiteApprovalData,
  ApprovalData,
  ApprovalEntityType,
  isInterventionApproval,
  isSiteApproval,
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
import { Button } from '@/components/ui/button';
import { dummyApprovalData } from '../data/dummyApprovalData';
import { dummyApprovalDataEnhanced } from '../data/dummyApprovalDataEnhanced';
import { dummySiteApprovalData } from '../data/dummySiteData';
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
import { arrayMove } from '@dnd-kit/sortable';
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
    updateApproval,
    updateApprovalStatus,
    setLoading,
    setError,
  } = useApprovalStore();

  const [entityType, setEntityType] = useState<ApprovalEntityType>('intervention');
  const [sites, setSites] = useState<SiteApprovalData[]>([]);

  const [columns, setColumns] = useState<ApprovalBoardColumn[]>([
    {
      status: 'new_request',
      title: 'New Requests',
      interventions: [],
      sites: [],
      items: [],
      color: '#F59E0B',
      badgeColor: 'bg-amber-500',
    },
    {
      status: 'in_review',
      title: 'In Review',
      interventions: [],
      sites: [],
      items: [],
      color: '#3B82F6',
      badgeColor: 'bg-blue-500',
    },
    {
      status: 'approved',
      title: 'Approved',
      interventions: [],
      sites: [],
      items: [],
      color: '#10B981',
      badgeColor: 'bg-green-500',
    },
    {
      status: 'rejected',
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
  const [activeSite, setActiveSite] = useState<SiteApprovalData | null>(null);

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
      const interventions = approvals.filter(
        (approval) => approval.approvalStatus === col.status && matchesSearch(approval)
      );
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

      // TODO: Replace with actual API call when backend is ready
      // const response = await getApprovalBoard(accessToken, projectId);
      // if (response.statusCode === 200) {
      //   setApprovals(response.data?.interventions || []);
      //   setSites(response.data?.sites || []);
      // } else {
      //   setError('Failed to load approvals');
      // }

      // Using dummy data for presentation
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay
      setApprovals([...dummyApprovalData, ...dummyApprovalDataEnhanced]);
      setSites(dummySiteApprovalData);
    } catch (err: any) {
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
    if (!selectedApproval) return;

    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await moveInterventionStatus(accessToken, {
      //   interventionId: selectedApproval.interventionId,
      //   newStatus,
      //   comment: comment || undefined,
      //   isInternal,
      // });

      // Using dummy data - simulate successful update
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Update the approval with the new status
      if (isInterventionApproval(selectedApproval)) {
        updateApprovalStatus(selectedApproval.interventionId, newStatus);

        // If there's a comment, add it to the approval
        if (comment) {
          const updatedApproval = approvals.find(
            (a) => a.interventionId === selectedApproval.interventionId
          );
          if (updatedApproval) {
            const newComment = {
              uid: `comment-${Date.now()}`,
              userId: 201,
              userName: 'Current User',
              userRole: isAdmin ? 'admin' : 'contributor' as any,
              comment,
              isInternal,
              createdAt: new Date().toISOString(),
            };
            updatedApproval.comments.push(newComment);
          }
        }
      } else {
        // Update site status
        const updatedSites = sites.map((site) =>
          site.siteId === selectedApproval.siteId
            ? { ...site, approvalStatus: newStatus }
            : site
        );
        setSites(updatedSites);

        // If there's a comment, add it to the site
        if (comment) {
          const updatedSite = updatedSites.find(
            (s) => s.siteId === selectedApproval.siteId
          );
          if (updatedSite) {
            const newComment = {
              uid: `comment-${Date.now()}`,
              userId: 201,
              userName: 'Current User',
              userRole: isAdmin ? 'admin' : 'contributor' as any,
              comment,
              isInternal,
              createdAt: new Date().toISOString(),
            };
            updatedSite.comments.push(newComment);
          }
        }
      }

      selectApproval(null);
    } catch (err: any) {
      // Revert on error
      await loadApprovals();
      setError(err.message || 'Failed to update status');
    }
  };

  const handleCommentAdd = async (comment: string, isInternal: boolean) => {
    if (!selectedApproval) return;

    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await addApprovalComment(accessToken, {
      //   interventionId: selectedApproval.interventionId,
      //   comment,
      //   isInternal,
      // });

      // Using dummy data - simulate successful comment addition
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (isInterventionApproval(selectedApproval)) {
        const updatedApproval = approvals.find(
          (a) => a.interventionId === selectedApproval.interventionId
        );

        if (updatedApproval) {
          const newComment = {
            uid: `comment-${Date.now()}`,
            userId: 201,
            userName: 'Current User',
            userRole: isAdmin ? 'admin' : 'contributor' as any,
            comment,
            isInternal,
            createdAt: new Date().toISOString(),
          };
          updatedApproval.comments.push(newComment);
          updateApproval(updatedApproval);
        }
      } else {
        const updatedSite = sites.find(
          (s) => s.siteId === selectedApproval.siteId
        );

        if (updatedSite) {
          const newComment = {
            uid: `comment-${Date.now()}`,
            userId: 201,
            userName: 'Current User',
            userRole: isAdmin ? 'admin' : 'contributor' as any,
            comment,
            isInternal,
            createdAt: new Date().toISOString(),
          };
          updatedSite.comments.push(newComment);
          // Update the sites state
          setSites(sites.map(s => s.siteId === updatedSite.siteId ? updatedSite : s));
        }
      }

      selectApproval(null);
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
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

  const handleDragEnd = (event: DragEndEvent) => {
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
      updateApprovalStatus(activeId, overColumn.status);
      // TODO: When backend is ready, uncomment this to sync with API
      // await moveInterventionStatus(accessToken, {
      //   interventionId: activeId,
      //   newStatus: overColumn.status,
      // });
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
      updateApprovalStatus(activeId, overIntervention.approvalStatus);
      // TODO: When backend is ready, uncomment this to sync with API
      // await moveInterventionStatus(accessToken, {
      //   interventionId: activeId,
      //   newStatus: overIntervention.approvalStatus,
      // });
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
