import { BrandingSectionProps } from "@shared-core/types/interface.app";
import Image from 'next/image';
import { FeatureCard } from "./FeatureCard";

export const BrandingSection: React.FC<BrandingSectionProps> = ({ features }) => {
  return (
    <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-center px-12 xl:px-20">
      <div className="max-w-2xl">
        {/* Logo and main heading */}
        <div className="mb-12">
          <div className="flex items-center mb-8">
            <div className="mb-4 flex items-center justify-center bg-gradient-to-br from-[#007A49] to-emerald-600 rounded-2xl mr-4 shadow-lg">
              <Image
                src="/tmlogo.png"
                alt="TreeMapper Logo"
                width={80}
                height={80}
                priority
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900" style={{ margin: 0, padding: 0 }}>TreeMapper</h1>
              <p className="text-lg text-gray-600 mt-1">
                Monitor restoration interventions as easy as locate, snap, measure
              </p>
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 gap-6 mb-12">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
};