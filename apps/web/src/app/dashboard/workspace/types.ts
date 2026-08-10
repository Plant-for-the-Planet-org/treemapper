export interface User {
  id: number;
  uid: string;
  email: string;
  firstname: string;
  lastname: string;
  displayName: string;
  image?: string;
  slug: string;
  type: 'individual' | 'tpo' | 'organization' | 'other' | 'school' | 'superadmin';
  isActive: boolean;
  projectCount: number;
  /** Present when API returns impersonation target id distinct from `uid` */
  userUid?: string;
}

export interface WorkspaceMember {
  id: number;
  uid: string;
  userId: number;
  user: User;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  joinedAt: string;
  lastActiveAt?: string;
}

export interface Workspace {
  id: number;
  uid: string;
  name: string;
  slug: string;
  type: 'platform' | 'private' | 'development' | 'premium';
  description?: string;
  image?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  isActive: boolean;
}

export interface WorkspaceNotificationSettings {
  onProjectCreate: boolean;
  onInterventionCreate: boolean;
  interventionProjectWhitelist: string[];
  onProfileActivity: boolean;
}

/** Which intervention sources require approval before being published. */
export type ApprovalGatedSource = 'web' | 'bulk' | 'mobile';

export interface ApprovalSettings {
  sources: Record<ApprovalGatedSource, boolean>;
  siteApprovalRequired: boolean;
}

export const DEFAULT_APPROVAL_SETTINGS: ApprovalSettings = {
  sources: { web: true, bulk: true, mobile: true },
  siteApprovalRequired: true,
};

export interface WorkspaceSettings {
  approvalBoardEnabled: boolean;
  /** Default approval settings every project in this workspace inherits. */
  approvalSettings: ApprovalSettings;
  defaultProjectVisibility: 'public' | 'private';
  allowMemberInvites: boolean;
  requireApprovalForNewProjects: boolean;
  maxProjects: number | null;
  notifications: WorkspaceNotificationSettings;
}

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  approvalBoardEnabled: false,
  approvalSettings: DEFAULT_APPROVAL_SETTINGS,
  defaultProjectVisibility: 'private',
  allowMemberInvites: false,
  requireApprovalForNewProjects: false,
  maxProjects: null,
  notifications: {
    onProjectCreate: false,
    onInterventionCreate: false,
    interventionProjectWhitelist: [],
    onProfileActivity: false,
  },
};

/** Fills any missing fields with defaults so older saved settings stay valid. */
export const normalizeApprovalSettings = (value: unknown): ApprovalSettings => {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const sources = (v.sources && typeof v.sources === 'object' ? v.sources : {}) as Record<string, unknown>;
  const d = DEFAULT_APPROVAL_SETTINGS;
  return {
    sources: {
      web: typeof sources.web === 'boolean' ? sources.web : d.sources.web,
      bulk: typeof sources.bulk === 'boolean' ? sources.bulk : d.sources.bulk,
      mobile: typeof sources.mobile === 'boolean' ? sources.mobile : d.sources.mobile,
    },
    siteApprovalRequired:
      typeof v.siteApprovalRequired === 'boolean' ? v.siteApprovalRequired : d.siteApprovalRequired,
  };
};

export type ProjectStatus = 'active' | 'in_review' | 'suspended' | 'disabled';
export type SiteStatus = 'planted' | 'planting' | 'barren' | 'reforestation' | 'planning';
export type ReviewStatus = 'pending' | 'in_review' | 'approved' | 'rejected';

export interface Site {
  uid: string;
  projectId: number;
  name: string;
  description: string | null;
  status: SiteStatus | null;
  area: number | null;
  soilType: string | null;
  elevation: number | null;
  waterAccess: boolean | null;
  accessibility: string | null;
  expectedTreeCount: number | null;
  image: string | null;
  reviewStatus: ReviewStatus | null;
  plannedPlantingDate: string | null;
  actualPlantingDate: string | null;
  flag: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectOwner {
  uid: string;
  displayName: string;
  email: string;
  image: string | null;
  slug: string;
}

export interface Project {
  id: number;
  uid: string;
  name: string;
  slug: string;
  description: string | null;
  purpose: string | null;
  type: string | null;
  ecosystem: string | null;
  country: string | null;
  isPublic: boolean;
  isActive: boolean;
  isPrimary: boolean;
  isPersonal: boolean;
  website: string | null;
  image: string | null;
  target: number | null;
  approvalBoardEnabled: boolean;
  flag: boolean | null;
  status: ProjectStatus;
  owner: ProjectOwner | null;
  memberCount: number;
  siteCount: number;
  sites: Site[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: number;
  uid: string;
  action: string;
  entityType: string;
  entityId: string;
  userId?: number;
  user?: User;
  description?: string;
  occurredAt: string;
  metadata?: unknown;
}

export type AuditAction =
  | 'create' | 'update' | 'delete' | 'soft_delete' | 'restore'
  | 'login' | 'logout' | 'invite' | 'accept_invite' | 'decline_invite'
  | 'role_change' | 'permission_change' | 'export' | 'import'
  | 'archive' | 'unarchive' | 'impersonation';

export type AuditEntityType =
  | 'user' | 'workspace' | 'workspace_member' | 'project' | 'project_member'
  | 'site' | 'intervention' | 'tree' | 'tree_record' | 'scientific_species'
  | 'project_species' | 'species_request' | 'project_invite' | 'bulk_invite'
  | 'image' | 'notification' | 'migration';

export interface WorkspaceAuditLog {
  id: number;
  uid: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: number;
  entityUid: string | null;
  changedFields: string[] | null;
  source: string | null;
  occurredAt: string;
  userUid: string | null;
  userDisplayName: string | null;
  userEmail: string | null;
  userImage: string | null;
}

export interface AuditLogsResponse {
  data: WorkspaceAuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface ImpersonationRecord {
  id: number;
  targetUser: User;
  adminUser: User;
  startedAt: string;
  endedAt?: string;
  duration?: string;
}

export type SpeciesRequestStatus = 'pending' | 'approved' | 'rejected';

export interface SpeciesRequest {
  id: number;
  uid: string;
  scientificName: string;
  commonName: string | null;
  description: string | null;
  requestReason: string;
  family: string | null;
  habitat: string | null;
  nativeRegion: string | null;
  conservationStatus: string | null;
  gbifId: string | null;
  wikipediaUrl: string | null;
  sourceUrl: string | null;
  urgency: string | null;
  status: SpeciesRequestStatus;
  adminNotes: string | null;
  rejectionReason: string | null;
  createdSpeciesId: number | null;
  reviewedAt: string | null;
  createdAt: string;
  requestedBy: { id: number; name: string | null; email: string | null } | null;
  project: { id: number; uid: string; projectName: string } | null;
}

export interface SpeciesRequestsResponse {
  data: SpeciesRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
