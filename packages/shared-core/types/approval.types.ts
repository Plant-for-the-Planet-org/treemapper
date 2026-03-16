// New backend review statuses
export type ReviewStatus =
  | 'draft'
  | 'pending'
  | 'in_review'
  | 'changes_requested'
  | 'in_revision'
  | 'resubmitted'
  | 'approved'
  | 'published'
  | 'unpublished'
  | 'rejected';

export type ReviewDecision = 'approved' | 'changes_requested' | 'rejected' | 'in_review';

export type ReviewCommentType =
  | 'general'
  | 'issue'
  | 'question'
  | 'response'
  | 'resolution'
  | 'system';

export type ReviewCommentAuthorRole = 'admin' | 'reviewer' | 'contributor';

export type IssueSeverity = 'error' | 'warning' | 'suggestion';

// Legacy statuses for backward compatibility
export type ApprovalStatus = 'new_request' | 'in_review' | 'approved' | 'rejected';

// Map old statuses to new statuses
export function mapLegacyStatusToReviewStatus(status: ApprovalStatus): ReviewStatus {
  const mapping: Record<ApprovalStatus, ReviewStatus> = {
    new_request: 'pending',
    in_review: 'in_review',
    approved: 'approved',
    rejected: 'rejected',
  };
  return mapping[status];
}

// Map new statuses to legacy statuses for UI display
export function mapReviewStatusToLegacyStatus(status: ReviewStatus): ApprovalStatus {
  if (status === 'pending' || status === 'draft') return 'new_request';
  if (status === 'in_review' || status === 'changes_requested' || status === 'in_revision' || status === 'resubmitted') return 'in_review';
  if (status === 'approved' || status === 'published') return 'approved';
  if (status === 'rejected' || status === 'unpublished') return 'rejected';
  return 'new_request';
}

export type ApprovalEntityType = 'intervention' | 'site';

// New backend review comment structure
export interface ReviewComment {
  id: number;
  uid: string;
  threadId: number;
  parentCommentId?: number;
  author: {
    id: number;
    displayName: string;
    image?: string;
  };
  authorRole: ReviewCommentAuthorRole;
  type: ReviewCommentType;
  message: string;
  targetField?: string;
  targetEntityType?: string;
  targetEntityUid?: string;
  severity?: IssueSeverity;
  isResolved: boolean;
  resolvedAt?: Date | string;
  resolvedBy?: {
    id: number;
    displayName: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
  replies?: ReviewComment[];
}

// Legacy comment structure for backward compatibility
export interface ApprovalComment {
  uid: string;
  userId: number;
  userName: string;
  userRole: 'owner' | 'admin' | 'contributor' | 'observer';
  comment: string;
  isInternal: boolean;
  createdAt: string;
}

// New backend review thread structure
export interface ReviewThread {
  id: number;
  uid: string;
  interventionId: number;
  threadNumber: number;
  status: 'open' | 'resolved' | 'closed';
  resolution?: ReviewDecision;
  resolvedAt?: Date | string;
  resolvedBy?: {
    id: number;
    displayName: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
  commentsCount?: number;
  unresolvedIssuesCount?: number;
}

// Legacy history entry for backward compatibility
export interface ApprovalHistoryEntry {
  uid: string;
  userId: number;
  userName: string;
  action: 'submitted' | 'moved_to_review' | 'approved' | 'rejected' | 'requested_revision' | 'resubmitted' | 'data_edited';
  fromStatus?: string;
  toStatus: string;
  comment?: string;
  changedFields?: string[];
  timestamp: string;
}

export interface SampleTree {
  treeId: string;
  treeTag?: string;
  species: string;
  scientificName?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  height?: number; // in meters
  diameter?: number; // DBH in cm
  health?: 'excellent' | 'good' | 'fair' | 'poor' | 'dead';
  age?: number; // estimated age in years
  plantingDate?: string;
  image: string | null;
  notes?: string;
  capturedAt: string;
}

// New backend intervention review summary
export interface InterventionReviewSummary {
  interventionId: number;
  interventionUid: string;
  interventionHid: string;
  interventionName?: string;
  type: string;
  reviewStatus: ReviewStatus;
  submittedAt?: Date | string;
  userId: number;
  userName: string;
  projectId: number;
  projectName: string;
  siteId?: number;
  siteName?: string;
  unresolvedIssuesCount: number;
  lastCommentAt?: Date | string;
  revisionCount: number;
  currentThreadId?: number;
}

// Legacy intervention approval data (for backward compatibility and UI)
export interface InterventionApprovalData {
  interventionId: number;
  interventionUid: string;
  interventionHid: string;
  type: string;
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
  approvalStatus: ApprovalStatus; // Legacy status for UI
  reviewStatus?: ReviewStatus; // New status from backend
  submittedForReviewAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  approvedBy: {
    id: number;
    name: string;
  } | null;
  comments: ApprovalComment[]; // Legacy comments
  reviewComments?: ReviewComment[]; // New review comments
  reviewThreads?: ReviewThread[]; // New review threads
  currentThread?: ReviewThread; // Current active thread
  history: ApprovalHistoryEntry[];
  interventionData: {
    description: string;
    location: any;
    area: number;
    totalTreeCount: number;
    totalSampleTreeCount?: number;
    sampleTrees?: SampleTree[];
    registrationDate: string;
    interventionStartDate: string;
    interventionEndDate: string;
    image: string | null;
    status?: 'planned' | 'active' | 'completed' | 'failed' | 'on-hold' | 'cancelled';
    captureMode?: 'on-site' | 'off-site' | 'external' | 'unknown' | 'web-upload';
    captureStatus?: 'complete' | 'partial' | 'incomplete';
    isPrivate?: boolean;
    editedAt?: string | null;
  };
  // New fields from backend
  unresolvedIssuesCount?: number;
  revisionCount?: number;
}

export interface SiteApprovalData {
  siteId: number;
  siteUid: string;
  name: string;
  description: string | null;
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
  approvalStatus: ApprovalStatus;
  reviewStatus?: ReviewStatus;
  currentThreadId?: number;
  submittedForReviewAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  approvedBy: {
    id: number;
    name: string;
  } | null;
  comments: ApprovalComment[];
  history: ApprovalHistoryEntry[];
  siteData: {
    location: any; // GeoJSON geometry
    area: number | null;
    status: 'planted' | 'planting' | 'barren' | 'reforestation' | 'planning';
    soilType: string | null;
    elevation: number | null;
    slope: number | null;
    waterAccess: boolean;
    accessibility: string | null;
    plannedPlantingDate: string | null;
    actualPlantingDate: string | null;
    expectedTreeCount: number | null;
    image: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export type ApprovalData = InterventionApprovalData | SiteApprovalData;

export interface ApprovalBoardFilters {
  projectId?: number;
  status?: ApprovalStatus;
  userId?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  entityType?: ApprovalEntityType;
}

export interface MoveInterventionStatusRequest {
  interventionId: number;
  newStatus: ApprovalStatus;
  comment?: string;
  isInternal?: boolean;
}

export interface AddCommentRequest {
  interventionId: number;
  comment: string;
  isInternal?: boolean;
}

export interface ApprovalBoardColumn {
  status: ApprovalStatus; // Legacy status for column mapping
  reviewStatus?: ReviewStatus | ReviewStatus[]; // New status(es) from backend
  title: string;
  interventions: InterventionApprovalData[];
  sites: SiteApprovalData[];
  items: ApprovalData[]; // Union of interventions and sites
  color: string;
  badgeColor: string;
}

// Type guards
export function isInterventionApproval(data: ApprovalData): data is InterventionApprovalData {
  return 'interventionId' in data;
}

export function isSiteApproval(data: ApprovalData): data is SiteApprovalData {
  return 'siteId' in data;
}
