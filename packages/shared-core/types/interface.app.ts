


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
