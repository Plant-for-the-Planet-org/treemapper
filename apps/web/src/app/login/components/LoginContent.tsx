"use client";

import React, { useState, useCallback } from 'react';
import { useSearchParams } from "next/navigation";
import {MapPin, Wifi, Database } from 'lucide-react';
import { BackgroundDecorations } from './BackgroundDecorations';
import { BrandingSection } from './BrandingSection';
import { LoginFooter } from './LoginFooter';
import { LoginForm } from './LoginForm';
import { MobileAppSection } from './MobileAppSection';
import { MobileLogo } from './MobileLogo';


export default function LoginContent() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [loading, setLoading] = useState(false);

  // Updated features based on website content
  const features = [
    {
      icon: MapPin,
      title: "Simple & Powerful",
      description: "Monitor restoration interventions as easy as locate, snap, measure. Built for places with limited or no connectivity."
    },
    {
      icon: Wifi,
      title: "Works Offline",
      description: "TreeMapper works offline, so you can collect data anywhere. Export data or upload automatically when connected."
    },
    {
      icon: Database,
      title: "60k+ Species & Custom Fields",
      description: "Customize tree names, add pictures, and use our powerful form builder to gather the exact data you need."
    }
  ];

  const handleLogin = useCallback(() => {
    setLoading(true);
    // Redirect to Auth0 login with returnTo parameter if it exists
    window.location.href = returnTo
      ? `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`
      : '/api/auth/login';
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

      <div className="relative min-h-screen flex">
        <BrandingSection features={features} />

        {/* Right side - Login form */}
        <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col justify-center items-center px-8 py-12 lg:px-12">
          <div className="w-full max-w-md space-y-8">
            <MobileLogo />

            <LoginForm loading={loading} onLogin={handleLogin} />

            <MobileAppSection
              onPlayStoreClick={handlePlayStore}
              onAppStoreClick={handleAppStore}
            />
          </div>
        </div>
      </div>

      <LoginFooter
        onImprintClick={handleImprint}
        onPolicyClick={handlePolicy}
        onTermsClick={handleTerms}
      />
    </div>
  );
}