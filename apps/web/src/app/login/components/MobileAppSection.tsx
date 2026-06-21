import Image from "next/image";
import { MobileAppSectionProps } from "@shared-core/types/interface.app";

const GooglePlayIcon = () => (
  <Image src="/playstore.png" alt="" width={28} height={28} className="h-7 w-7" aria-hidden="true" />
);

const AppleIcon = () => (
  <Image src="/apple.png" alt="" width={28} height={28} className="h-7 w-7" aria-hidden="true" />
);

const StoreBadge = ({
  onClick,
  icon,
  top,
  bottom,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  top: string;
  bottom: string;
}) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center gap-2.5 rounded-[20px] bg-[#101813] px-3 py-2.5 text-white transition-all duration-200 hover:bg-black focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007A49]/25"
  >
    {icon}
    <span className="text-left leading-tight">
      <span className="block text-[10px] font-medium tracking-wide text-white/70">{top}</span>
      <span className="block text-sm font-semibold">{bottom}</span>
    </span>
  </button>
);

export const MobileAppSection: React.FC<MobileAppSectionProps> = ({ onPlayStoreClick, onAppStoreClick }) => {
  return (
    <div className="rounded-[12px] border border-[#007A49]/10 bg-white/70 p-5 backdrop-blur-sm">
      <div className="mb-4 text-center">
        <h3 className="font-semibold text-[#0F1F17]">Get the mobile app</h3>
        <p className="mt-0.5 text-sm text-[#5A6B61]">Map restoration on the go, even offline.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StoreBadge
          onClick={onPlayStoreClick}
          icon={<GooglePlayIcon />}
          top="GET IT ON"
          bottom="Google Play"
        />
        <StoreBadge
          onClick={onAppStoreClick}
          icon={<AppleIcon />}
          top="Download on the"
          bottom="App Store"
        />
      </div>
    </div>
  );
};
