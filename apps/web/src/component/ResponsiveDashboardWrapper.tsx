// components/ResponsiveDashboardWrapper.tsx
'use client';

import { useEffect, useState } from 'react';
import MobileDownloadPrompt from './MobileDownloadPage';

interface ResponsiveDashboardWrapperProps {
  children: React.ReactNode;
}

export default function ResponsiveDashboardWrapper({ children }: ResponsiveDashboardWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 500); // 768px is the md breakpoint in Tailwind
      setIsLoading(false);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Show a loading state while checking screen size
  if (isLoading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center" style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isMobile ? <MobileDownloadPrompt /> : <>{children}</>;
}