import * as AppInterface from '@shared-core/types/interface.app'
import { Plus, ArrowRight } from 'lucide-react';



export const CreateOrganizationForm: React.FC<AppInterface.CreateOrganizationFormProps> = ({
  newOrgName,
  setNewOrgName,
  onCreateOrganization,
  isCreating
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newOrgName.trim() && !isCreating) {
      onCreateOrganization(e);
    }
  };

  return (
    <div className="mb-8">
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors focus-within:border-[#007A49] focus-within:bg-gray-100">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-12 h-12 bg-white border border-gray-300 rounded-lg">
            <Plus className="w-6 h-6 text-gray-400" />
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Create a new organization..."
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-lg font-medium bg-transparent border-none outline-none placeholder-gray-500 text-gray-900 focus:placeholder-gray-400"
              disabled={isCreating}
              autoFocus
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter a name to create your organization workspace
            </p>
          </div>
          <button
            onClick={onCreateOrganization}
            disabled={!newOrgName.trim() || isCreating}
            className="inline-flex items-center px-4 py-2 bg-[#007A49] text-white text-sm font-medium rounded-lg hover:bg-[#006B3F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                Create
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};