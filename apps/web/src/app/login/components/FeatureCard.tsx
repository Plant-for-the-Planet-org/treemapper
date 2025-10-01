import { FeatureCardProps } from "@shared-core/types/interface.app";

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => {
  return (
    <div className="flex items-start space-x-4 p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm">
      <div className="flex items-center justify-center w-16 h-12 bg-[#007A49]/10 rounded-xl">
        <Icon className="w-6 h-6 text-[#007A49]" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};