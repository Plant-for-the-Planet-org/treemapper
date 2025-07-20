import { OrganizationGridProps } from "@shared-core/types/interface.app";
import { OrganizationCard } from "./OrganizationCard";

export const OrganizationGrid: React.FC<OrganizationGridProps> = ({ organizations, onSelectOrganization }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {organizations.map((org) => (
        <OrganizationCard
          key={org.id}
          organization={org}
          onSelect={onSelectOrganization}
        />
      ))}
    </div>
  );
};
