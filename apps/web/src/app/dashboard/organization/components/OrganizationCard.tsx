import { OrganizationCardProps } from "@shared-core/types/interface.app";
import { User, Users, Calendar , Building2} from "lucide-react";
import { useCallback } from "react";


export const OrganizationCard: React.FC<OrganizationCardProps> = ({ organization, onSelect }) => {

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleClick = useCallback(() => {
    onSelect(organization.uid);
  }, [organization.uid, onSelect]);

  return (
    <div
      onClick={handleClick}
      className="group bg-white border border-gray-200 rounded-lg p-6 hover:border-[#007A49] hover:shadow-lg transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start space-x-4">
        <div className="flex items-center justify-center w-12 h-12 bg-[#007A49]/10 rounded-lg group-hover:bg-[#007A49]/20 transition-colors">
          {!organization.image && <Building2 className="w-6 h-6 text-[#007A49]" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#007A49] transition-colors truncate">
            {organization.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {organization.description}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              {organization.memberCount} members
            </span>
          </div>
          <span className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {formatDate(organization.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};