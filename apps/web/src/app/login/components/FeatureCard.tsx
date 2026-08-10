import { FeatureCardProps } from "@shared-core/types/interface.app";

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => {
  return (
    <div className="flex items-start gap-4 rounded-[12px] bg-white/55 px-4 py-3.5 ring-1 ring-[#007A49]/10 backdrop-blur-sm transition-colors hover:bg-white/80">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#007A49]/10 text-[#007A49]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[#0F1F17]">{title}</h3>
        <p className="mt-0.5 text-sm leading-snug text-[#5A6B61]">{description}</p>
      </div>
    </div>
  );
};
