


export interface Organization {
  uid: number;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  memberCount: number;
  image?: any;
}

export interface CreateOrganizationFormProps {
  newOrgName: string;
  setNewOrgName: (name: string) => void;
  onCreateOrganization: (e: React.FormEvent) => void;
  isCreating: boolean;
}

export interface OrganizationCardProps {
  organization: Organization;
  onSelect: (orgId: number) => void;
}

export interface OrganizationGridProps {
  organizations: Organization[];
  onSelectOrganization: (orgId: number) => void;
}

export interface EmptyStateProps {
  searchTerm: string;
}

export interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export interface PageHeaderProps {
  title: string;
  description: string;
  canProceed: boolean;
  handleContinueToDashboard: () => void
  isLoading: boolean
}

export interface FooterProps { }


export interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

export interface TrustIndicatorProps {
  icon: React.ElementType;
  label: string;
}

export interface LoginFormProps {
  loading: boolean;
  onLogin: () => void;
}

export interface MobileAppSectionProps {
  onPlayStoreClick: () => void;
  onAppStoreClick: () => void;
}

export interface BrandingSectionProps {
  features: Array<{
    icon: React.ElementType;
    title: string;
    description: string;
  }>;
}

export interface LoginFooterProps {
  onImprintClick: () => void;
  onPolicyClick: () => void;
  onTermsClick: () => void;
}


export interface UserInterface {
  uid: string;
  email: string;
  authName: string;
  name?: string;
  firstname?: string;
  lastname?: string;
  displayName?: string;
  image?: string;
  slug?: string;
  type: 'individual' | 'organization' | 'education' | 'tpo' | 'student'
  country?: string;
  url?: string;
  isPrivate: boolean;
  bio?: string;
  locale: string;
  isActive: boolean;
  createdAt: string;
  migratedAt?: string;
  primaryWorkspaceUid: string | null;
  primaryProjectUid: string | null;
  workspace: 'admin' | 'owner' | 'member'
  impersonated: boolean | null
}

export interface ProjectWithUserRoleI {
  uid: string;
  createdById: number;
  slug: string;
  purpose: string | null;
  name: string;
  type: string | null;
  ecosystem: string | null;
  scale: string | null;
  target: number | null;
  website: string | null;
  description: string | null;
  classification: string | null;
  image: string | null;
  videoUrl: string | null;
  country: string | null; // 2-character country code
  location: unknown | null; // PostGIS geometry - typically handled as GeoJSON on frontend
  originalGeometry: string | null;
  geoLatitude: number | null;
  geoLongitude: number | null;
  url: string | null;
  linkText: string | null;
  isActive: boolean;
  isPublic: boolean;
  intensity: string | null;
  revisionPeriodicityLevel: string | null;
  metadata: any | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  workspace: any,
  "userRole": string
}