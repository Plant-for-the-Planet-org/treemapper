
export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  error: string | null;
  data: T;
  code: string;
}



export interface Organization {
  id: string;
  name: string;
  description?: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
  slug?: string;
}


export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// User Types
export interface User {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  avatar?: string;
  timezone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRequest {
  displayName?: string;
  avatar?: string;
  timezone?: string;
}

export interface PreSignUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface PreSignUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  fileKey: string;
}

// Project Types
export interface Project {
  id: number;
  uid: string;
  name: string;
  slug: string;
  description?: string;
  projectType: 'personal' | 'organization' | 'public';
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userRole: 'owner' | 'admin' | 'member' | 'viewer';
  userStatus: 'active' | 'inactive' | 'pending';
  joinedAt: string;
  memberCount: number;
  projectCount?: number;
  organizationId?: string;
}

export interface CreateProjectRequest {
  projectName: string;
  projectType: 'personal' | 'organization' | 'public';
  description?: string;
  organizationId?: string;
}

export interface UpdateProjectSettingsRequest {
  name?: string;
  description?: string;
  timezone?: string;
  isActive?: boolean;
}

// Team Member Types
export interface TeamMember {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  joinedAt: string;
}

export interface UpdateMemberRoleRequest {
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

// Species Types
export interface Species {
  id: string;
  scientificName: string;
  commonName?: string;
  family?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProjectSpecies {
  id: string;
  speciesId: string;
  projectId: string;
  species: Species;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectSpeciesRequest {
  speciesId: string;
  scientificName?: string;
  commonName?: string;
}

export interface UpdateProjectSpeciesRequest {
  scientificName?: string;
  commonName?: string;
  isActive?: boolean;
}

export interface SpeciesRequest {
  id: string;
  scientificName: string;
  commonName?: string;
  family?: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  createdAt: string;
}

// Site Types
export interface Site {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  area?: number;
  projectId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSiteRequest {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  area?: number;
}

// Intervention Types
export interface Intervention {
  id: string;
  uid: string;
  type: 'planting' | 'maintenance' | 'monitoring';
  title: string;
  description?: string;
  date: string;
  location: {
    latitude: number;
    longitude: number;
  };
  area?: number;
  speciesCount?: number;
  projectId: string;
  siteId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInterventionRequest {
  type: 'planting' | 'maintenance' | 'monitoring';
  title: string;
  description?: string;
  date: string;
  latitude: number;
  longitude: number;
  area?: number;
  speciesCount?: number;
  siteId?: string;
}

export interface InterventionQueryParams {
  page?: number;
  limit?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
  siteId?: string;
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'normal' | 'high';
  isRead: boolean;
  createdAt: string;
  deliveredAt: string;
  expiresAt?: string;
  actionUrl?: string;
  actionText?: string;
  category?: string;
  deliveryMethod?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  image?: string;
}

// Invite Types
export interface ProjectInvite {
  id: string;
  uuid: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  projectId: string;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
}

export interface CreateInviteRequest {
  email: string;
  role: 'admin' | 'member' | 'viewer';
  expiresIn?: number; // days
}

export interface InviteLink {
  id: string;
  uuid: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'active' | 'expired';
  projectId: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  usageCount: number;
  maxUsage?: number;
}

export interface CreateInviteLinkRequest {
  role: 'admin' | 'member' | 'viewer';
  expiresIn?: number; // days
  maxUsage?: number;
}

export interface AcceptInviteRequest {
  uuid: string;
}

// Analytics Types
export interface DashboardKPIs {
  totalInterventions: number;
  totalTrees: number;
  totalArea: number;
  totalSpecies: number;
  totalSites: number;
  recentPlantings: number;
  monthlyGrowth: number;
}

export interface OverviewGraphData {
  date: string;
  interventions: number;
  trees: number;
  area: number;
}

export interface RecentAddition {
  id: string;
  type: 'intervention' | 'site' | 'species';
  title: string;
  description?: string;
  date: string;
  createdBy: string;
  location?: string;
}

export interface ProjectMapData {
  sites: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    interventionCount: number;
  }>;
  interventions: Array<{
    id: string;
    latitude: number;
    longitude: number;
    type: string;
    date: string;
  }>;
}

// Migration Types
export interface MigrationStatus {
  isRequired: boolean;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface StartMigrationRequest {
  confirm: boolean;
}

// Query Configuration Types
export interface QueryConfig {
  staleTime?: number;
  cacheTime?: number;
  retry?: number;
  refetchOnWindowFocus?: boolean;
  enabled?: boolean;
}

export interface MutationConfig {
  onSuccess?: (data: any, variables?: any) => void;
  onError?: (error: Error, variables?: any) => void;
  onSettled?: (data: any, error: Error | null, variables?: any) => void;
}
