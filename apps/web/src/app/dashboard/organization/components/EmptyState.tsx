import { EmptyStateProps } from "@shared-core/types/interface.app";
import { Building2 } from "lucide-react";

export const EmptyState: React.FC<EmptyStateProps> = ({ searchTerm }) => {
  return (
    <div className="text-center py-12">
      <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {searchTerm ? 'No organizations found' : 'No organizations yet'}
      </h3>
      <p className="text-gray-600">
        {searchTerm
          ? 'Try adjusting your search terms or create a new organization.'
          : 'Create your first organization to get started with TreeMapper.'
        }
      </p>
    </div>
  );
};