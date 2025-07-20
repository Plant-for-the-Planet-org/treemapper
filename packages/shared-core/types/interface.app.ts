


export interface Organization {
  id: number;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  memberCount: number;
  icon: any;
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
