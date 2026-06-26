import Image from 'next/image';
import tmLogo from '@/assets/tmlogo.png';

export const MobileLogo: React.FC = () => {
  return (
    <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
      <Image
        src={tmLogo}
        alt="TreeMapper logo"
        width={48}
        height={48}
        className="rounded-2xl shadow-sm ring-1 ring-black/5"
        priority
      />
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F1F17]" style={{ margin: 0 }}>TreeMapper</h1>
        <p className="text-sm text-[#5A6B61]">Forest restoration monitoring</p>
      </div>
    </div>
  );
};
