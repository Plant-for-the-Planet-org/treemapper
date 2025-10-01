import { TrustIndicatorProps } from "@shared-core/types/interface.app";

export const TrustIndicator: React.FC<TrustIndicatorProps> = ({ icon: Icon, label }) => {
  return (
    <div className="text-center">
      <Icon className="w-6 h-6 text-[#007A49] mx-auto mb-2" />
      <p className="text-xs font-medium text-gray-600">{label}</p>
    </div>
  );
};
