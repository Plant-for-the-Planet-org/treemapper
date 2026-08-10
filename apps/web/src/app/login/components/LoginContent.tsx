"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from "next/navigation";
import { MapPin, WifiOff, Leaf } from 'lucide-react';
import { BackgroundDecorations } from './BackgroundDecorations';
import { BrandingSection } from './BrandingSection';
import { LoginFooter } from './LoginFooter';
import { LoginForm } from './LoginForm';
import { MobileAppSection } from './MobileAppSection';
import { MobileLogo } from './MobileLogo';
import { useRouter, usePathname } from 'next/navigation';
import { useAccessToken } from '@/hooks/useAccessToken';
import EmailVerificationModal from '@/component/EmailVerificationModal';
import {
  buildSocialAuthorizeUrl,
  buildUniversalLoginAuthorizeUrl,
} from '@/lib/auth/auth0-config';
import { getSafeRedirectPath } from '@/lib/utils/auth';


export default function LoginContent() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? searchParams.get('redirectTo');
  const [loading, setLoading] = useState<string | false>(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, tokenError, tokenLoading, accessToken } = useAccessToken()

  useEffect(() => {
    if (!tokenLoading && user) {
      router.push(getSafeRedirectPath(returnTo));
      return
    }
  }, [user, tokenLoading, router, returnTo]);

  // When the user starts a login redirect and then comes back (browser back),
  // the page is restored from the bfcache with `loading` still set, leaving
  // every button disabled. Reset it on restore so they can try another way.
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setLoading(false);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  // Branding highlights shown on the login screen
  const features = [
    {
      icon: MapPin,
      title: "Map every tree",
      description: "Pin each site and tree with GPS accuracy. Locate, snap, and measure right from the field."
    },
    {
      icon: WifiOff,
      title: "Works anywhere, even offline",
      description: "No signal, no problem. Collect data anywhere and let it sync the moment you reconnect."
    },
    {
      icon: Leaf,
      title: "60,000+ species, your way",
      description: "Pick real species names, attach photos, and build custom forms to capture exactly what you need."
    }
  ];

  const handleLogin = useCallback(async (connection?: string) => {
    setLoading(connection || 'auth0');

    try {
      const redirectTo = getSafeRedirectPath(returnTo);

      const authorizeUrl = connection && connection !== 'auth0'
        ? await buildSocialAuthorizeUrl(connection, redirectTo)
        : await buildUniversalLoginAuthorizeUrl(redirectTo);

      window.location.assign(authorizeUrl);
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
    }
  }, [returnTo]);

  const handleImprint = useCallback(() => {
    window.open("https://www.plant-for-the-planet.org/imprint/#:~:text=The%20Plant%2Dfor%2Dthe%2DPlanet%20Foundation%20is%20a%20legally,Your%20donation%20is%20tax%20deductible", '_blank', 'noopener,noreferrer');
  }, []);

  const handlePolicy = useCallback(() => {
    window.open('https://www.plant-for-the-planet.org/privacy-terms/', '_blank', 'noopener,noreferrer');
  }, []);

  const handleTerms = useCallback(() => {
    window.open('https://www.plant-for-the-planet.org/terms-and-conditions/', '_blank', 'noopener,noreferrer');
  }, []);

  const handlePlayStore = useCallback(() => {
    window.open('https://play.google.com/store/apps/details?id=org.pftp.treemapper', '_blank', 'noopener,noreferrer');
  }, []);

  const handleAppStore = useCallback(() => {
    window.open('https://apps.apple.com/in/app/treemapper/id1524353784', '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      <BackgroundDecorations />
      <EmailVerificationModal />
      <div className="relative flex min-h-screen">
        <BrandingSection features={features} />

        {/* Right side - Login form */}
        <div className="flex w-full flex-col overflow-y-auto px-6 py-12 sm:px-8 lg:w-[35%] lg:px-12">
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="w-full max-w-md space-y-6">
              <MobileLogo />

              <LoginForm loading={loading} onLogin={handleLogin} />

              <MobileAppSection
                onPlayStoreClick={handlePlayStore}
                onAppStoreClick={handleAppStore}
              />
            </div>
          </div>

          <LoginFooter
            onImprintClick={handleImprint}
            onPolicyClick={handlePolicy}
            onTermsClick={handleTerms}
          />
        </div>
      </div>
    </div>
  );
}