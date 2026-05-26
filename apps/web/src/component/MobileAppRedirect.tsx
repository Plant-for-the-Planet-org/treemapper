'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';

interface MobileAppBannerProps {
  projectInvite?: string;
  projectLink?: string;
  onClose: () => void;
  onOpenApp: () => void;
}

const MobileAppBanner: React.FC<MobileAppBannerProps> = ({ onClose, onOpenApp }) => (
  <div className="fixed bottom-4 left-4 right-4 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4 flex items-center gap-3">
    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
      <img src="/icon.png" alt="TreeMapper" className="w-full h-full object-cover" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 leading-tight">Better on the app</p>
      <p className="text-xs text-gray-500 mt-0.5">Open TreeMapper for the full experience</p>
    </div>
    <button
      onClick={onOpenApp}
      className="flex-shrink-0 bg-[#007A49] text-white text-xs font-medium px-3 py-1.5 rounded-full hover:bg-[#006040] transition-colors"
    >
      Open
    </button>
    <button onClick={onClose} className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    </button>
  </div>
);

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

    // Determine when to trigger deep link logic
    const isDashboardOrHome = pathname.startsWith('/dashboard') || pathname === '/';
    const hasReturnTo = !!searchParams.get('returnTo');
    const isLoginWithReturnTo = pathname.startsWith('/login') && hasReturnTo;

    // Only show banner / attempt redirect for:
    // - mobile users on dashboard/home
    // - or login page that has a returnTo (e.g. deep link from email)
    if (mobileCheck && (isDashboardOrHome || isLoginWithReturnTo)) {
      // Extract invite/link either from top-level query or nested inside returnTo
      let projectInvite = searchParams.get('project-invite');
      let projectLink = searchParams.get('project-link');

      if (!projectInvite && !projectLink) {
        const returnTo = searchParams.get('returnTo');
        if (returnTo) {
          try {
            const nestedUrl = new URL(returnTo, globalThis.location.origin);
            projectInvite = nestedUrl.searchParams.get('project-invite');
            projectLink = nestedUrl.searchParams.get('project-link');
          } catch (e) {
            console.error('Failed to parse returnTo for deep link', e);
          }
        }
      }
      
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
    // Reuse the same resolution logic as in the effect:
    // prefer top-level params, then fall back to values nested in returnTo
    let projectInvite = searchParams.get('project-invite');
    let projectLink = searchParams.get('project-link');

    if (!projectInvite && !projectLink) {
      const returnTo = searchParams.get('returnTo');
      if (returnTo) {
        try {
          const nestedUrl = new URL(returnTo, globalThis.location.origin);
          projectInvite = nestedUrl.searchParams.get('project-invite');
          projectLink = nestedUrl.searchParams.get('project-link');
        } catch (e) {
          console.error('Failed to parse returnTo for deep link', e);
        }
      }
    }

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