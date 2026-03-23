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

export interface Project {
  id: number;
  uid: string;
  projectName: string;
  slug: string;
  isPublic: boolean;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
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

export interface ImpersonationRecord {
  id: number;
  targetUser: User;
  adminUser: User;
  startedAt: string;
  endedAt?: string;
  duration?: string;
}
