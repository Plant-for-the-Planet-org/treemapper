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

    // Check if we already attempted redirect to prevent loops
    const redirectAttempted = sessionStorage.getItem('treemapper-redirect-attempted');

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
      
      // Try silent redirect only once per session
      if (!redirectAttempted) {
        sessionStorage.setItem('treemapper-redirect-attempted', 'true');
        
        if (iosCheck) {
          trySilentRedirect(projectInvite, projectLink, 'ios');
        } else if (androidCheck) {
          trySilentRedirect(projectInvite, projectLink, 'android');
        }
      } else {
        // If already attempted, just show banner
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [searchParams, pathname]);

  const buildUniversalLink = (projectInvite: string | null, projectLink: string | null): string => {
    // This creates the universal/app link that opens the app if configured
    const baseUrl = 'treemapper://dashboard';
    const params = new URLSearchParams();
    
    if (projectInvite) {
      params.append('project-invite', projectInvite);
    } else if (projectLink) {
      params.append('project-link', projectLink);
    }
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  };

  const trySilentRedirect = (
    projectInvite: string | null, 
    projectLink: string | null, 
    platform: 'ios' | 'android'
  ) => {
    const deepLink = buildUniversalLink(projectInvite, projectLink);
    
    // Create invisible iframe to attempt app opening (works better on some browsers)
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLink;
    document.body.appendChild(iframe);
    
    // Also try direct location change as fallback
    setTimeout(() => {
      try {
        window.location.href = deepLink;
      } catch (e) {
        console.log('Deep link attempt failed');
      }
    }, 100);
    
    // Clean up iframe
    setTimeout(() => {
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
    }, 1000);
    
    // Check if app opened by detecting if page is hidden
    const checkAppOpened = () => {
      if (document.hidden) {
        // App opened successfully, don't show banner
        return;
      }
      
      // App didn't open, show banner after delay
      setShowBanner(true);
    };
    
    // Wait appropriate time based on platform
    const waitTime = platform === 'ios' ? 2500 : 3000;
    setTimeout(checkAppOpened, waitTime);
  };

  const handleOpenApp = () => {
    const projectInvite = searchParams.get('project-invite');
    const projectLink = searchParams.get('project-link');
    const deepLink = buildUniversalLink(projectInvite, projectLink);
    
    // Try to open the app
    window.location.href = deepLink;
    
    // Set up fallback to app store
    const appStoreUrl = isIOS 
      ? 'https://apps.apple.com/app/treemapper/id1524353784'
      : 'https://play.google.com/store/apps/details?id=org.pftp.treemapper';
    
    const fallbackTime = isIOS ? 2500 : 3000;
    
    const fallbackTimer = setTimeout(() => {
      // Only redirect to store if page is still visible (app didn't open)
      if (!document.hidden) {
        window.location.href = appStoreUrl;
      }
    }, fallbackTime);
    
    // Clear fallback if page becomes hidden (app opened)
    const visibilityHandler = () => {
      if (document.hidden) {
        clearTimeout(fallbackTimer);
      }
    };
    
    document.addEventListener('visibilitychange', visibilityHandler);
    
    // Cleanup
    setTimeout(() => {
      document.removeEventListener('visibilitychange', visibilityHandler);
    }, fallbackTime + 1000);
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