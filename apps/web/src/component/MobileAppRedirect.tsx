'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';

interface MobileAppBannerProps {
  projectInvite?: string;
  projectLink?: string;
  onClose: () => void;
  onOpenApp: () => void;
}

const MobileAppBanner: React.FC<MobileAppBannerProps> = ({ 
  projectInvite, 
  projectLink, 
  onClose, 
  onOpenApp 
}) => {
  const getInviteText = () => {
    if (projectInvite) return `Project Invite: ${projectInvite.slice(0, 8)}...`;
    if (projectLink) return `Project Link: ${projectLink.slice(0, 8)}...`;
    return null;
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-green-600 to-green-500 text-white p-4 text-center z-50 shadow-lg animate-slide-down">
      <button
        onClick={onClose}
        className="absolute top-2 right-4 text-white text-xl font-bold bg-transparent border-none cursor-pointer"
        aria-label="Close banner"
      >
        ×
      </button>
      <div>
        <div className="font-bold text-lg mb-1">🌳 Open in TreeMapper App</div>
        <div className="text-sm mb-3">Get the full experience with our mobile app!</div>
        {getInviteText() && (
          <div className="text-xs mb-2 opacity-90">
            {getInviteText()}
          </div>
        )}
        <button
          onClick={onOpenApp}
          className="bg-white text-green-600 border-none px-4 py-2 rounded-full font-bold cursor-pointer hover:bg-gray-100 transition-colors"
        >
          Open App
        </button>
      </div>
    </div>
  );
};

const MobileAppRedirectInner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user dismissed banner in this session
    const dismissed = sessionStorage.getItem('treemapper-banner-dismissed');
    if (dismissed) {
      return;
    }

    // Check if user is on mobile
    const userAgent = navigator.userAgent;
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const iosCheck = /iPad|iPhone|iPod/.test(userAgent);
    const androidCheck = /Android/i.test(userAgent);
    
    setIsMobile(mobileCheck);
    setIsIOS(iosCheck);
    setIsAndroid(androidCheck);

    // Only show banner for mobile users on dashboard pages
    if (mobileCheck && (pathname.startsWith('/dashboard') || pathname === '/')) {
      const projectInvite = searchParams.get('project-invite');
      const projectLink = searchParams.get('project-link');
      
      // If there's a project parameter, try immediate redirect first
      if (projectInvite || projectLink) {
        if (iosCheck) {
          tryDirectRedirect(projectInvite, projectLink, 'ios');
        } else if (androidCheck) {
          tryDirectRedirect(projectInvite, projectLink, 'android');
        }
      }
      
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, pathname]);

  const buildDeepLinkUrl = (projectInvite: string | null, projectLink: string | null): string => {
    const baseUrl = 'https://dash.treemapper.app/dashboard';
    const params = new URLSearchParams();
    
    if (projectInvite) {
      params.append('project-invite', projectInvite);
    } else if (projectLink) {
      params.append('project-link', projectLink);
    }
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  };

  const buildCustomSchemeUrl = (projectInvite: string | null, projectLink: string | null): string => {
    const params = new URLSearchParams();
    
    if (projectInvite) {
      params.append('project-invite', projectInvite);
    } else if (projectLink) {
      params.append('project-link', projectLink);
    }
    
    return params.toString() 
      ? `treemapper://dashboard?${params.toString()}` 
      : 'treemapper://dashboard';
  };

  const tryDirectRedirect = (
    projectInvite: string | null, 
    projectLink: string | null, 
    platform: 'ios' | 'android'
  ) => {
    const universalLink = buildDeepLinkUrl(projectInvite, projectLink);
    
    if (platform === 'ios') {
      // For iOS, try universal link first (iOS will automatically open the app if installed)
      window.location.href = universalLink;
      
      // If app doesn't open within 2.5 seconds, show banner
      setTimeout(() => {
        if (!document.hidden) {
          setShowBanner(true);
        }
      }, 2500);
    } else if (platform === 'android') {
      // For Android, try app link first (Android will automatically open the app if installed)
      window.location.href = universalLink;
      
      // Fallback to custom scheme after a short delay if app link doesn't work
      setTimeout(() => {
        if (!document.hidden) {
          const customSchemeUrl = buildCustomSchemeUrl(projectInvite, projectLink);
          window.location.href = customSchemeUrl;
        }
      }, 1500);
      
      // If app doesn't open within 3 seconds, show banner
      setTimeout(() => {
        if (!document.hidden) {
          setShowBanner(true);
        }
      }, 3000);
    }
  };

  const handleOpenApp = () => {
    const projectInvite = searchParams.get('project-invite');
    const projectLink = searchParams.get('project-link');
    
    if (isIOS) {
      // iOS handling
      const universalLink = buildDeepLinkUrl(projectInvite, projectLink);
      const customSchemeUrl = buildCustomSchemeUrl(projectInvite, projectLink);
      
      // Try universal link first
      window.location.href = universalLink;
      
      // Fallback to custom scheme
      setTimeout(() => {
        if (!document.hidden) {
          window.location.href = customSchemeUrl;
        }
      }, 1000);
      
      // Final fallback to App Store
      setTimeout(() => {
        if (!document.hidden) {
          const appStoreUrl = 'https://apps.apple.com/app/treemapper/id1524353784';
          window.location.href = appStoreUrl;
        }
      }, 2500);
      
    } else if (isAndroid) {
      // Android handling
      const universalLink = buildDeepLinkUrl(projectInvite, projectLink);
      const customSchemeUrl = buildCustomSchemeUrl(projectInvite, projectLink);
      
      // Try app link first
      window.location.href = universalLink;
      
      // Fallback to custom scheme
      setTimeout(() => {
        if (!document.hidden) {
          window.location.href = customSchemeUrl;
        }
      }, 1500);
      
      // Final fallback to Play Store
      setTimeout(() => {
        if (!document.hidden) {
          const playStoreUrl = 'https://play.google.com/store/apps/details?id=org.pftp.treemapper';
          window.location.href = playStoreUrl;
        }
      }, 3000);
    } else {
      // Other mobile platforms, just hide banner
      setShowBanner(false);
    }
  };

  const handleCloseBanner = () => {
    setShowBanner(false);
    // Store in sessionStorage to not show again during this session
    sessionStorage.setItem('treemapper-banner-dismissed', 'true');
  };

  // Auto-hide banner after 15 seconds
  useEffect(() => {
    if (showBanner) {
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [showBanner]);

  // Add CSS for animation
  useEffect(() => {
    if (showBanner) {
      const style = document.createElement('style');
      style.textContent = `
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        body {
          padding-top: ${showBanner ? '120px' : '0'};
          transition: padding-top 0.3s ease;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
        document.body.style.paddingTop = '0';
      };
    }
  }, [showBanner]);

  if (!isMobile || !showBanner) {
    return null;
  }

  return (
    <MobileAppBanner
      projectInvite={searchParams.get('project-invite') || undefined}
      projectLink={searchParams.get('project-link') || undefined}
      onClose={handleCloseBanner}
      onOpenApp={handleOpenApp}
    />
  );
};

// Wrapper component with Suspense boundary
const MobileAppRedirect: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <MobileAppRedirectInner />
    </Suspense>
  );
};

export default MobileAppRedirect;