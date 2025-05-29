"use client";

import React, { useState } from 'react';
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import EmailVerificationModal from '../../components/EmailVerificationModal';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    setLoading(true);
    // Redirect to Auth0 login with returnTo parameter if it exists
    window.location.href = returnTo
      ? `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`
      : '/api/auth/login';
  };

  const openImprint = () => {
    window.open("https://www.plant-for-the-planet.org/imprint/#:~:text=The%20Plant%2Dfor%2Dthe%2DPlanet%20Foundation%20is%20a%20legally,Your%20donation%20is%20tax%20deductible", '_blank', 'noopener,noreferrer');
  };

  const openPolicy = () => {
    window.open('https://www.plant-for-the-planet.org/privacy-terms/', '_blank', 'noopener,noreferrer');
  };

  const openTerms = () => {
    window.open('https://www.plant-for-the-planet.org/terms-and-conditions/', '_blank', 'noopener,noreferrer');
  };

  const contact = () => {
    window.open('https://www.plant-for-the-planet.org/contact/', '_blank', 'noopener,noreferrer');
  };

  const openPlayStore = () => {
    window.open('https://play.google.com/store/apps/details?id=org.pftp.treemapper', '_blank', 'noopener,noreferrer');
  };

  const openAppStore = () => {
    window.open('https://apps.apple.com/in/app/treemapper/id1524353784', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden">
      <EmailVerificationModal />
      {/* Left section with background image - 70% on desktop, full width on mobile */}
      <div className="hidden md:block md:w-[70%] h-full relative">
        <Image
          src="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=2574&auto=format&fit=crop"
          alt="Forest background"
          fill
          sizes="100vw" // This tells Next.js the image could potentially be 100% of the viewport width
          style={{ objectFit: 'cover' }}
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="text-white text-center p-8">
            <h2 className="text-4xl font-bold mb-4">TreeMapper</h2>
            <p className="text-xl">The free monitoring tool for forest restoration programs</p>
          </div>
        </div>
      </div>

      {/* Right section with login UI - 30% on desktop, full width on mobile */}
      <div className="w-full md:w-[30%] h-full bg-white flex flex-col">
        {/* Mobile version of the header image */}
        <div className="md:hidden w-full h-40 relative">
          <Image
            src="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=2574&auto=format&fit=crop"
            alt="Forest background"
            fill
            sizes="100vw" // This tells Next.js the image could potentially be 100% of the viewport width
            style={{ objectFit: 'cover' }}
            priority
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <h2 className="text-white text-2xl font-bold">TreeMapper</h2>
          </div>
        </div>

        {/* Login section - centered */}
        <div className="flex-grow flex flex-col justify-center items-center px-6 py-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Welcome to TreeMapper</h1>
              <p className="mt-2 text-gray-600">Helping conserve forests through technology <br></br>and community engagement</p>
            </div>

            {/* {error && (
              <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg">
                {error}
              </div>
            )} */}

            {/* Google Sign In Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-green-700 text-sm font-medium text-white hover:bg-green-800 transition-colors"
            >
              {loading ? "Signing in..." : "Login | Sign up"}
            </button>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Having problems logging in? <a href="mailto:info@plant-for-the-planet.org" className="text-green-600 hover:text-green-800">Contact us</a>
              </p>
            </div>

            {/* App Download Section */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Download TreeMapper App</h3>
                <p className="text-sm text-gray-600 mt-1">Restoration monitoring made easy — a smart tool to locate, snap, and measure your impact.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                {/* Google Play Store Button */}
                <button
                  onClick={openPlayStore}
                  className="flex items-center gap-3 px-5 py-2 bg-black rounded-2xl hover:bg-gray-900 shadow-md hover:scale-105 transition-all duration-200"
                >
                  <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.92 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-gray-300">GET IT ON</div>
                    <div className="text-sm font-semibold text-white">Google Play</div>
                  </div>
                </button>

                {/* App Store Button */}
                <button
                  onClick={openAppStore}
                  className="flex items-center gap-3 px-5 py-2 bg-black rounded-2xl hover:bg-gray-900 shadow-md hover:scale-105 transition-all duration-200"
                >
                  <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.19 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-gray-300">Download on the</div>
                    <div className="text-sm font-semibold text-white">App Store</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 text-center text-xs text-gray-500 border-t border-gray-200">
          <div className="flex justify-center space-x-4">
            <a href="/imprint" className="hover:text-green-600" onClick={openImprint}>Imprint</a>
            <a href="/privacy-policy" className="hover:text-green-600" onClick={openPolicy}>Privacy Policy</a>
            <a href="/terms" className="hover:text-green-600" onClick={openTerms}>Terms of Service</a>
          </div>
          <p className="mt-2">© {new Date().getFullYear()} TreeMapper. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}