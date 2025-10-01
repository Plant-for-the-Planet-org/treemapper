'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';

interface MobileAppBannerProps {
  inviteId?: string;
  onClose: () => void;
  onOpenApp: () => void;
}

const MobileAppBanner: React.FC<MobileAppBannerProps> = ({ inviteId, onClose, onOpenApp }) => {
  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-green-600 to-green-500 text-white p-4 text-center z-50 shadow-lg animate-slide-down">
      <button
        onClick={onClose}
        className="absolute top-2 right-4 text-white text-xl font-bold bg-transparent border-none cursor-pointer"
      >
        ×
      </button>
      <div>
        <div className="font-bold text-lg mb-1">🌳 Open in TreeMapper App</div>
        <div className="text-sm mb-3">Get the full experience with our mobile app!</div>
        {inviteId && (
          <div className="text-xs mb-2 opacity-90">
            Project Invite: {inviteId}
          </div>
        )}
        <button
          onClick={onOpenApp}
          className="bg-white text-green-600 border-none px-4 py-2 rounded-full font-bold cursor-pointer hover:bg-gray-100 transition-colors"
        >
          {/* Show different text based on platform */}
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
      const inviteParam = searchParams.get('invite');
      
      // If there's an invite parameter, try immediate redirect first
      if (inviteParam) {
        if (iosCheck) {
          tryDirectRedirect(inviteParam, 'ios');
        } else if (androidCheck) {
          tryDirectRedirect(inviteParam, 'android');
        }
      }
      
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, pathname]);

  const tryDirectRedirect = (inviteId: string, platform: 'ios' | 'android') => {
    if (platform === 'ios') {
      // For iOS, try universal link first (this should work automatically)
      const universalLink = `https://dev.treemapper.app/dashboard?invite=${inviteId}`;
      
      // Create a hidden iframe to trigger the app
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = universalLink;
      document.body.appendChild(iframe);
      
      // Clean up iframe after a short delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    } else if (platform === 'android') {
      // For Android, try app link first
      const appLink = `https://dev.treemapper.app/dashboard?invite=${inviteId}`;
      
      // Try to open the app link
      window.location.href = appLink;
      
      // Fallback to custom scheme after a short delay
      setTimeout(() => {
        if (!document.hidden) {
          window.location.href = `treemapper://dashboard?invite=${inviteId}`;
        }
      }, 1500);
    }

    // If app doesn't open within 2.5 seconds, show banner
    setTimeout(() => {
      if (!document.hidden) {
        setShowBanner(true);
      }
    }, 2500);
  };

  const handleOpenApp = () => {
    const inviteId = searchParams.get('invite');
    const currentUrl = window.location.href;
    
    if (isIOS) {
      // iOS handling
      if (inviteId) {
        window.location.href = `treemapper://invite?projectId=${inviteId}`;
      } else {
        window.location.href = `treemapper://dashboard`;
      }
      
      // Fallback to App Store after delay
      setTimeout(() => {
        if (!document.hidden) {
          const appStoreUrl = 'https://apps.apple.com/app/treemapper/YOUR_APP_ID';
          window.location.href = appStoreUrl;
        }
      }, 2000);
      
    } else if (isAndroid) {
      // Android handling
      if (inviteId) {
        // Try app link first
        window.location.href = `https://dev.treemapper.app/dashboard?invite=${inviteId}`;
        
        // Fallback to custom scheme
        setTimeout(() => {
          if (!document.hidden) {
            window.location.href = `treemapper://dashboard?invite=${inviteId}`;
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
        // No invite, just try to open app
        window.location.href = `treemapper://dashboard`;
        
        // Fallback to Play Store
        setTimeout(() => {
          if (!document.hidden) {
            const playStoreUrl = 'https://play.google.com/store/apps/details?id=org.pftp.treemapper';
            window.location.href = playStoreUrl;
          }
        }, 2000);
      }
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

  // Don't show banner if user previously dismissed it in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('treemapper-banner-dismissed');
    if (dismissed) {
      setShowBanner(false);
    }
  }, []);

  // Auto-hide banner after 10 seconds
  useEffect(() => {
    if (showBanner) {
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 10000);
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
      inviteId={searchParams.get('invite') || undefined}
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