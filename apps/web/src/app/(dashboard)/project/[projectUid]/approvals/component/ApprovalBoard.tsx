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
import {
  getReviewQueue,
  getSiteReviewQueue,
  getWorkspaceReviewQueue,
  getWorkspaceSiteReviewQueue,
  submitReviewDecision,
  submitSiteReviewDecision,
  addAdminComment,
  addFieldWorkerComment,
  addAdminSiteComment,
  addFieldWorkerSiteComment,
  getCurrentThread,
} from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import { useUserStore } from '@shared-core/store/useUserStore';
import { Loader2, Search, X, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
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

// Scope tells the board where to load its queue from and how to resolve the
// project for each mutation:
// - project:   one project, queue scoped to it, role-based admin/field-worker.
// - workspace: every project in the workspace, project resolved per item,
//              always acting as an admin.
export type ApprovalBoardScope =
  | { kind: 'project'; projectUid: string; userRole: string }
  | { kind: 'workspace'; workspaceUid: string };

interface ApprovalBoardProps {
  scope: ApprovalBoardScope;
  // Optional page-level header rendered above the toolbar.
  title?: string;
  subtitle?: string;
}

type FilterMode = 'all' | 'mine';

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

// Map a raw review-queue row into the intervention shape the board renders.
// projectUid/projectName are only present on the workspace queue; they are
// undefined for the single-project queue, which is fine.
function mapInterventionRow(item: any): InterventionApprovalData {
  return {
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
    projectUid: item.projectUid,
    projectName: item.projectName,
  };
}

function mapSiteRow(item: any): SiteApprovalData {
  return {
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
  };
}

export const ApprovalBoard: React.FC<ApprovalBoardProps> = ({ scope, title, subtitle }) => {
  const { accessToken } = useToken();
  const currentUser = useUserStore((state) => state.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [approvals, setApprovals] = useState<InterventionApprovalData[]>([]);
  const [sites, setSites] = useState<SiteApprovalData[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<
    InterventionApprovalData | SiteApprovalData | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [entityType, setEntityType] = useState<ApprovalEntityType>('intervention');
  const [columns, setColumns] = useState<ApprovalBoardColumn[]>([]);
  const [activeIntervention, setActiveIntervention] =
    useState<InterventionApprovalData | null>(null);
  const [activeSite, setActiveSite] = useState<SiteApprovalData | null>(null);

  // Store the original column when drag starts, so we can compare on drop
  const dragOriginalColumnRef = useRef<ApprovalStatus | null>(null);

  // Workspace acts as admin across all projects. Project scope is role-based.
  const isAdmin =
    scope.kind === 'workspace'
      ? true
      : scope.userRole === 'owner' || scope.userRole === 'admin';

  // The project to target for a mutation. Constant in project scope; carried on
  // the item in workspace scope (queue spans many projects).
  const resolveProjectUid = (item: { projectUid?: string }): string | undefined =>
    scope.kind === 'project' ? scope.projectUid : item.projectUid;

  const scopeReady = scope.kind === 'project' ? !!scope.projectUid : !!scope.workspaceUid;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (scopeReady && accessToken) {
      loadApprovals();
      loadSites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.kind, scopeReady, accessToken]);

  // "Mine" filter: best-effort client-side match on creator name, since the
  // queue rows do not carry a stable user id for the signed-in reviewer.
  const myName = (currentUser?.displayName || currentUser?.name || '').trim().toLowerCase();
  const matchesFilterMode = (item: InterventionApprovalData | SiteApprovalData): boolean => {
    if (filterMode === 'all') return true;
    if (!myName) return true;
    return item.createdBy.name.trim().toLowerCase() === myName;
  };

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
        return (
          columnReviewStatuses.includes(approval.reviewStatus) &&
          matchesSearch(approval) &&
          matchesFilterMode(approval)
        );
      });

      const sitesList = sites.filter((site) => {
        if (!site.reviewStatus) return false;
        return (
          columnReviewStatuses.includes(site.reviewStatus) &&
          matchesSearch(site) &&
          matchesFilterMode(site)
        );
      });

      return {
        ...col,
        interventions,
        sites: sitesList,
        items: entityType === 'intervention' ? interventions : sitesList,
      };
    });

    setColumns(updatedColumns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvals, sites, entityType, searchQuery, filterMode, myName]);

  const loadApprovals = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    try {
      if (!silent) setLoading(true);

      const response =
        scope.kind === 'project'
          ? await getReviewQueue(accessToken, scope.projectUid, { limit: 100, page: 1 })
          : await getWorkspaceReviewQueue(accessToken, scope.workspaceUid, {
              limit: 100,
              page: 1,
            });

      if (response.statusCode === 200 && response.data) {
        setApprovals(response.data.data.map(mapInterventionRow));
      } else {
        toast.error(response.message || 'Failed to load approvals');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load approvals');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadSites = async () => {
    try {
      const response =
        scope.kind === 'project'
          ? await getSiteReviewQueue(accessToken, scope.projectUid, { limit: 100, page: 1 })
          : await getWorkspaceSiteReviewQueue(accessToken, scope.workspaceUid, {
              limit: 100,
              page: 1,
            });

      if (response.statusCode === 200 && response.data) {
        setSites(response.data.data.map(mapSiteRow));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load sites');
    }
  };

  const handleCardClick = (id: number) => {
    if (entityType === 'intervention') {
      const intervention = approvals.find((a) => a.interventionId === id);
      if (intervention) setSelectedApproval(intervention);
    } else {
      const site = sites.find((s) => s.siteId === id);
      if (site) setSelectedApproval(site);
    }
  };

  const handleStatusChange = async (
    newStatus: ApprovalStatus,
    comment: string,
    _isInternal: boolean
  ): Promise<boolean> => {
    if (!selectedApproval || !isInterventionApproval(selectedApproval)) return false;

    const projectUid = resolveProjectUid(selectedApproval);
    if (!projectUid) return false;

    const decision = mapColumnStatusToDecision(newStatus);
    if (!decision) {
      toast.error('Cannot move to this status');
      return false;
    }

    try {
      setLoading(true);

      const response = await submitReviewDecision(
        accessToken,
        projectUid,
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
        setSelectedApproval(null);
        return true;
      }

      toast.error(response.message || 'Failed to update status');
      return false;
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdd = async (comment: string, _isInternal: boolean): Promise<boolean> => {
    if (!selectedApproval || !isInterventionApproval(selectedApproval)) return false;

    const projectUid = resolveProjectUid(selectedApproval);
    if (!projectUid) return false;

    try {
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
        return false;
      }

      const commentDto = {
        type: 'general' as const,
        message: comment,
      };

      let response;
      if (isAdmin) {
        response = await addAdminComment(accessToken, projectUid, threadUid, commentDto);
      } else {
        response = await addFieldWorkerComment(accessToken, threadUid, commentDto);
      }

      if (response.statusCode === 200 || response.statusCode === 201) {
        // Refresh card counts quietly; keep the modal open. The modal
        // refreshes its own thread inline.
        await loadApprovals({ silent: true });
        return true;
      }

      toast.error(response.message || 'Failed to add comment');
      return false;
    } catch (err: any) {
      toast.error(err.message || 'Failed to add comment');
      return false;
    }
  };

  const handleSiteStatusChange = async (
    newStatus: ApprovalStatus,
    comment: string,
    _isInternal: boolean
  ): Promise<boolean> => {
    if (!selectedApproval || !isSiteApproval(selectedApproval)) return false;

    const projectUid = resolveProjectUid(selectedApproval);
    if (!projectUid) return false;

    const decision = mapColumnStatusToDecision(newStatus);
    if (!decision) {
      toast.error('Cannot move to this status');
      return false;
    }
    try {
      setLoading(true);
      const response = await submitSiteReviewDecision(
        accessToken,
        projectUid,
        selectedApproval.siteUid,
        { decision: decision as 'in_review' | 'approved' | 'rejected', note: comment || undefined }
      );
      if (response.statusCode === 200 || response.statusCode === 201) {
        await loadSites();
        setSelectedApproval(null);
        return true;
      }
      toast.error(response.message || 'Failed to update site status');
      return false;
    } catch (err: any) {
      toast.error(err.message || 'Failed to update site status');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSiteCommentAdd = async (
    comment: string,
    _isInternal: boolean
  ): Promise<boolean> => {
    if (!selectedApproval || !isSiteApproval(selectedApproval)) return false;

    const projectUid = resolveProjectUid(selectedApproval);
    if (!projectUid) return false;

    try {
      const commentDto = { type: 'general' as const, message: comment };
      let response;
      if (isAdmin) {
        response = await addAdminSiteComment(
          accessToken,
          projectUid,
          selectedApproval.siteUid,
          commentDto
        );
      } else {
        response = await addFieldWorkerSiteComment(
          accessToken,
          selectedApproval.siteUid,
          commentDto
        );
      }
      if (response.statusCode === 200 || response.statusCode === 201) {
        // Refresh quietly; keep the modal open. The modal refreshes its
        // own thread inline.
        await loadSites();
        return true;
      }
      toast.error(response.message || 'Failed to add comment');
      return false;
    } catch (err: any) {
      toast.error(err.message || 'Failed to add comment');
      return false;
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
        const projectUid = resolveProjectUid(intervention);
        if (!projectUid) return;
        const response = await submitReviewDecision(
          accessToken,
          projectUid,
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
        const projectUid = resolveProjectUid(site);
        if (!projectUid) return;
        const response = await submitSiteReviewDecision(accessToken, projectUid, site.siteUid, {
          decision: decision as 'in_review' | 'approved' | 'rejected',
        });
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

  const activeItems = entityType === 'intervention' ? approvals : sites;
  const awaitingCount = activeItems.filter((i) => {
    const s = mapReviewStatusToLegacyStatus(i.reviewStatus || 'pending');
    return s === 'new_request' || s === 'in_review';
  }).length;

  const segBtn = (active: boolean) =>
    cn(
      'rounded-md px-3 py-1 text-xs font-medium transition-colors',
      active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
    );

  return (
    <>
      {/* Page header */}
      {title && (
        <div className="mb-4">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            {awaitingCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 size={12} />
                {awaitingCount} awaiting review
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search HID, site or type..."
            className="h-9 pl-9 pr-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Entity toggle */}
        <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
          <button type="button" className={segBtn(entityType === 'intervention')} onClick={() => setEntityType('intervention')}>
            Interventions
          </button>
          <button type="button" className={segBtn(entityType === 'site')} onClick={() => setEntityType('site')}>
            Sites
          </button>
        </div>

        {/* Scope filter */}
        <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
          <button type="button" className={segBtn(filterMode === 'all')} onClick={() => setFilterMode('all')}>
            All
          </button>
          <button type="button" className={segBtn(filterMode === 'mine')} onClick={() => setFilterMode('mine')}>
            Mine
          </button>
        </div>

        {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
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
        onClose={() => setSelectedApproval(null)}
        onStatusChange={
          selectedApproval && isSiteApproval(selectedApproval)
            ? handleSiteStatusChange
            : handleStatusChange
        }
        onCommentAdd={
          selectedApproval && isSiteApproval(selectedApproval)
            ? handleSiteCommentAdd
            : handleCommentAdd
        }
      />
    </>
  );
};
