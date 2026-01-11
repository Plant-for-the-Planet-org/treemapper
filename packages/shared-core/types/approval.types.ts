export type ApprovalStatus = 'new_request' | 'in_review' | 'approved' | 'rejected';

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
    registrationDate: string;
    interventionStartDate: string;
    interventionEndDate: string;
    image: string | null;
  };
}

export interface ApprovalBoardFilters {
  projectId?: number;
  status?: ApprovalStatus;
  userId?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
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
  color: string;
  badgeColor: string;
}
