export type ApprovalStatus = 'new_request' | 'in_review' | 'approved' | 'rejected';
export type ApprovalEntityType = 'intervention' | 'site';

export interface ApprovalComment {
  uid: string;
  userId: number;
  userName: string;
  userRole: 'owner' | 'admin' | 'contributor' | 'observer';
  comment: string;
  isInternal: boolean;
  createdAt: string;
}

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
  approvalStatus: ApprovalStatus;
  submittedForReviewAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  approvedBy: {
    id: number;
    name: string;
  } | null;
  comments: ApprovalComment[];
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
  status: ApprovalStatus;
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
