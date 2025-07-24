import Spinner from "@/component/Spinner";
import { PageHeaderProps } from "@shared-core/types/interface.app";

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, canProceed, handleContinueToDashboard, isLoading }) => {
  return (
    <div className="flex" style={{justifyContent:'space-between'}}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>
      {true && (
        <div className="text-center">
          <button
            onClick={handleContinueToDashboard}
            disabled={isLoading}
            className="px-8 py-3 bg-[#007A49] text-white rounded-lg hover:bg-[#006141] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto font-medium text-lg"
          >
            {isLoading ? (
              <>
                <Spinner />
                Processing...
              </>
            ) : (
              'Continue to Dashboard'
            )}
          </button>
        </div>
      )}
    </div>

  );
};