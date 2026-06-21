import { BrandingSectionProps } from "@shared-core/types/interface.app";
import Image from 'next/image';
import { FeatureCard } from "./FeatureCard";
import { PlantationScene } from "./PlantationScene";
import tmLogo from '@/assets/tmlogo.png';

export const BrandingSection: React.FC<BrandingSectionProps> = ({ features }) => {
  return (
    <div className="relative hidden lg:flex lg:w-[65%] flex-col justify-between overflow-hidden bg-gradient-to-b from-[#F1F8F4] via-[#E9F4ED] to-[#DCEFE3] px-12 py-12 xl:px-20">
      {/* topographic contour texture (map motif) */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full text-[#007A49]/[0.06]"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="topo" width="220" height="220" patternUnits="userSpaceOnUse">
            <path
              d="M-20 120 C 60 60 160 60 240 120 M-20 170 C 60 110 160 110 240 170 M-20 70 C 60 10 160 10 240 70"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#topo)" />
      </svg>

      {/* brand mark */}
      <div className="relative z-10 flex items-center gap-3">
        <Image
          src={tmLogo}
          alt="TreeMapper logo"
          width={44}
          height={44}
          className="rounded-2xl shadow-sm ring-1 ring-black/5"
          priority
        />
        <span className="text-xl font-semibold tracking-tight text-[#024E32]">TreeMapper</span>
      </div>

      {/* headline + features */}
      <div className="relative z-10 max-w-xl">
        {/* <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-[#007A49] ring-1 ring-[#007A49]/15">
          <span className="h-1.5 w-1.5 rounded-full bg-[#007A49]" />
          Built by Plant-for-the-Planet
        </span> */}

        <h1 className="text-5xl font-bold leading-[1.04] tracking-tight text-[#0F1F17] xl:text-6xl">
          Plant. Map.
          <br />
          <span className="text-[#007A49]">Measure.</span>
        </h1>

        <p className="mt-5 max-w-md text-lg leading-relaxed text-[#3C4F44]">
          TreeMapper turns your field work into restoration data you can trust. Record every intervention and tree, online or off, with proof built in.
        </p>

        <div className="mt-9 space-y-3">
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

      {/* ambient restoration scene */}
      <PlantationScene className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-44 w-full xl:h-52" />

      {/* keeps justify-between balanced above the scene */}
      <div className="relative z-10 h-2" />
    </div>
  );
};
