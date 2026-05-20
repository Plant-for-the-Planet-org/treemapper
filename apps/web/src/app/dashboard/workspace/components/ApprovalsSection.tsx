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
import { ApprovalColumn } from '@/app/dashboard/approvals/component/ApprovalColumn';
import { ApprovalModal } from '@/app/dashboard/approvals/component/ApprovalModal';
import {
  getWorkspaceReviewQueue,
  getWorkspaceSiteReviewQueue,
  submitReviewDecision,
  submitSiteReviewDecision,
  addAdminComment,
  addAdminSiteComment,
  getCurrentThread,
  getCurrentSiteThread,
} from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import useProjectStore from '@shared-core/store/useProjectStore';
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
import { ApprovalCard } from '@/app/dashboard/approvals/component/ApprovalCard';
import { SiteApprovalCard } from '@/app/dashboard/approvals/component/SiteApprovalCard';

const COLUMN_DEFINITIONS: Omit<ApprovalBoardColumn, 'interventions' | 'sites' | 'items'>[] = [
  { status: 'new_request', reviewStatus: ['draft', 'pending'], title: 'New Requests', color: '#F59E0B', badgeColor: 'bg-amber-500' },
  { status: 'in_review', reviewStatus: ['in_review', 'changes_requested', 'in_revision', 'resubmitted'], title: 'In Review', color: '#3B82F6', badgeColor: 'bg-blue-500' },
  { status: 'approved', reviewStatus: ['approved', 'published'], title: 'Approved', color: '#10B981', badgeColor: 'bg-green-500' },
  { status: 'rejected', reviewStatus: ['rejected', 'unpublished'], title: 'Rejected', color: '#EF4444', badgeColor: 'bg-red-500' },
];

function mapColumnStatusToDecision(columnStatus: ApprovalStatus): ReviewDecision | null {
  switch (columnStatus) {
    case 'in_review': return 'in_review';
    case 'approved': return 'approved';
    case 'rejected': return 'rejected';
    default: return null;
  }
}

export function ApprovalsSection() {
  const { accessToken } = useToken();
  const { selectedWorkspce: selectedWorkspace } = useProjectStore((state) => state);

  const [approvals, setApprovals] = useState<InterventionApprovalData[]>([]);
  const [sites, setSites] = useState<SiteApprovalData[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<InterventionApprovalData | SiteApprovalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [entityType, setEntityType] = useState<ApprovalEntityType>('intervention');
  const [columns, setColumns] = useState<ApprovalBoardColumn[]>([]);
  const [activeIntervention, setActiveIntervention] = useState<InterventionApprovalData | null>(null);
  const [activeSite, setActiveSite] = useState<SiteApprovalData | null>(null);
  const dragOriginalColumnRef = useRef<ApprovalStatus | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (selectedWorkspace?.uid && accessToken) {
      loadApprovals();
      loadSites();
    }
  }, [selectedWorkspace?.uid, accessToken]);

  useEffect(() => {
    const updatedColumns: ApprovalBoardColumn[] = COLUMN_DEFINITIONS.map((col) => {
      const colStatuses = col.reviewStatus as ReviewStatus[];
      const interventions = approvals.filter(
        (a) => a.reviewStatus && colStatuses.includes(a.reviewStatus),
      );
      const sitesList = sites.filter(
        (s) => s.reviewStatus && colStatuses.includes(s.reviewStatus),
      );
      return { ...col, interventions, sites: sitesList, items: entityType === 'intervention' ? interventions : sitesList };
    });
    setColumns(updatedColumns);
  }, [approvals, sites, entityType]);

  const loadApprovals = async () => {
    if (!selectedWorkspace?.uid) return;
    try {
      setLoading(true);
      const response = await getWorkspaceReviewQueue(accessToken, selectedWorkspace.uid, { limit: 100, page: 1 });
      if (response.statusCode === 200 && response.data) {
        const mapped: InterventionApprovalData[] = response.data.data.map((item: any) => ({
          interventionId: item.interventionId,
          interventionUid: item.interventionUid,
          interventionHid: item.interventionHid,
          type: item.type,
          createdBy: { id: item.userId, name: item.userName, email: '' },
          approvalStatus: mapReviewStatusToLegacyStatus(item.reviewStatus),
          reviewStatus: item.reviewStatus,
          submittedForReviewAt: item.submittedAt ? new Date(item.submittedAt).toISOString() : null,
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
          projectUid: item.projectUid,
          projectName: item.projectName,
        }));
        setApprovals(mapped);
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
    if (!selectedWorkspace?.uid) return;
    try {
      const response = await getWorkspaceSiteReviewQueue(accessToken, selectedWorkspace.uid, { limit: 100, page: 1 });
      if (response.statusCode === 200 && response.data) {
        const mapped: SiteApprovalData[] = response.data.data.map((item: any) => ({
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
          projectUid: item.projectUid,
          projectName: item.projectName,
        }));
        setSites(mapped);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load sites');
    }
  };

  const handleCardClick = (id: number) => {
    if (entityType === 'intervention') {
      const item = approvals.find((a) => a.interventionId === id);
      if (item) setSelectedApproval(item);
    } else {
      const item = sites.find((s) => s.siteId === id);
      if (item) setSelectedApproval(item);
    }
  };

  const handleStatusChange = async (newStatus: ApprovalStatus, comment: string, _isInternal: boolean) => {
    if (!selectedApproval || !isInterventionApproval(selectedApproval)) return;
    const projectUid = selectedApproval.projectUid;
    if (!projectUid) return;
    const decision = mapColumnStatusToDecision(newStatus);
    if (!decision) { toast.error('Cannot move to this status'); return; }
    try {
      setLoading(true);
      const response = await submitReviewDecision(accessToken, projectUid, selectedApproval.interventionUid, {
        decision: decision as 'approved' | 'rejected' | 'changes_requested',
        note: comment || undefined,
      });
      if (response.statusCode === 200 || response.statusCode === 201) {
        await loadApprovals();
        setSelectedApproval(null);
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
    const projectUid = selectedApproval.projectUid;
    if (!projectUid) return;
    try {
      setLoading(true);
      const threadResponse = await getCurrentThread(accessToken, selectedApproval.interventionUid);
      const threadUid = threadResponse.statusCode === 200 ? threadResponse.data?.uid : undefined;
      if (!threadUid) { toast.error('No active review thread found.'); return; }
      const response = await addAdminComment(accessToken, projectUid, threadUid, { type: 'general', message: comment });
      if (response.statusCode === 200 || response.statusCode === 201) {
        await loadApprovals();
        setSelectedApproval(null);
      } else {
        toast.error(response.message || 'Failed to add comment');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleSiteStatusChange = async (newStatus: ApprovalStatus, comment: string, _isInternal: boolean) => {
    if (!selectedApproval || !isSiteApproval(selectedApproval)) return;
    const projectUid = selectedApproval.projectUid;
    if (!projectUid) return;
    const decision = mapColumnStatusToDecision(newStatus);
    if (!decision) { toast.error('Cannot move to this status'); return; }
    try {
      setLoading(true);
      const response = await submitSiteReviewDecision(accessToken, projectUid, selectedApproval.siteUid, {
        decision: decision as 'in_review' | 'approved' | 'rejected',
        note: comment || undefined,
      });
      if (response.statusCode === 200 || response.statusCode === 201) {
        await loadSites();
        setSelectedApproval(null);
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
    const projectUid = selectedApproval.projectUid;
    if (!projectUid) return;
    try {
      setLoading(true);
      const response = await addAdminSiteComment(accessToken, projectUid, selectedApproval.siteUid, { type: 'general', message: comment });
      if (response.statusCode === 200 || response.statusCode === 201) {
        await loadSites();
        setSelectedApproval(null);
      } else {
        toast.error(response.message || 'Failed to add comment');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = Number(event.active.id);
    if (entityType === 'intervention') {
      const item = approvals.find((a) => a.interventionId === activeId);
      if (item) {
        setActiveIntervention(item);
        dragOriginalColumnRef.current = mapReviewStatusToLegacyStatus(item.reviewStatus || 'pending');
      }
    } else {
      const item = sites.find((s) => s.siteId === activeId);
      if (item) {
        setActiveSite(item);
        dragOriginalColumnRef.current = mapReviewStatusToLegacyStatus(item.reviewStatus || 'pending');
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const originalColumn = dragOriginalColumnRef.current;
    setActiveIntervention(null);
    setActiveSite(null);
    dragOriginalColumnRef.current = null;
    if (!over || !originalColumn) return;

    const activeId = Number(active.id);
    let targetColumnStatus: ApprovalStatus | null = null;
    const overCol = COLUMN_DEFINITIONS.find((col) => col.status === over.id);
    if (overCol) {
      targetColumnStatus = overCol.status;
    } else if (entityType === 'intervention') {
      const overItem = approvals.find((a) => a.interventionId === Number(over.id));
      if (overItem?.reviewStatus) targetColumnStatus = mapReviewStatusToLegacyStatus(overItem.reviewStatus);
    } else {
      const overItem = sites.find((s) => s.siteId === Number(over.id));
      if (overItem?.reviewStatus) targetColumnStatus = mapReviewStatusToLegacyStatus(overItem.reviewStatus);
    }

    if (!targetColumnStatus || targetColumnStatus === originalColumn) return;
    const decision = mapColumnStatusToDecision(targetColumnStatus);
    if (!decision) { toast.error('Cannot move items back to New Requests'); return; }

    try {
      setLoading(true);
      if (entityType === 'intervention') {
        const item = approvals.find((a) => a.interventionId === activeId);
        if (!item || !item.projectUid) return;
        const response = await submitReviewDecision(accessToken, item.projectUid, item.interventionUid, {
          decision: decision as 'approved' | 'rejected' | 'changes_requested',
        });
        if (response.statusCode === 200 || response.statusCode === 201) await loadApprovals();
        else toast.error(response.message || 'Failed to update status');
      } else {
        const item = sites.find((s) => s.siteId === activeId);
        if (!item || !item.projectUid) return;
        const response = await submitSiteReviewDecision(accessToken, item.projectUid, item.siteUid, {
          decision: decision as 'in_review' | 'approved' | 'rejected',
        });
        if (response.statusCode === 200 || response.statusCode === 201) await loadSites();
        else toast.error(response.message || 'Failed to update site status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedWorkspace) {
    return <div className="p-6 text-gray-500 text-sm">No workspace selected.</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Approvals</h2>
        <p className="text-sm text-gray-500">
          All interventions and sites awaiting review across every project in {selectedWorkspace.name}.
        </p>
      </div>

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
        {loading && <Loader2 className="h-4 w-4 animate-spin text-[#007A49]" />}
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
        isAdmin
        onClose={() => setSelectedApproval(null)}
        onStatusChange={selectedApproval && isSiteApproval(selectedApproval) ? handleSiteStatusChange : handleStatusChange}
        onCommentAdd={selectedApproval && isSiteApproval(selectedApproval) ? handleSiteCommentAdd : handleCommentAdd}
      />
    </div>
  );
}
