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


  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden">
      <EmailVerificationModal/>
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
            <p className="text-xl">Mapping and monitoring forests for a sustainable future</p>
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
              <p className="mt-2 text-gray-600">Helping conserve forests through technology and community engagement</p>
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
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-green-700 text-sm font-medium text-white hover:bg-gray-50 transition-colors"
            >
              {loading ? "Signing in..." : "Login | Sign up"}
            </button>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Having problems logging in? <a href="mailto:support@treemapper.org" className="text-green-600 hover:text-green-800">Contact us</a>
              </p>
            </div>


          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 text-center text-xs text-gray-500 border-t border-gray-200">
          <div className="flex justify-center space-x-4">
            <a href="/imprint" className="hover:text-green-600">Imprint</a>
            <a href="/privacy-policy" className="hover:text-green-600">Privacy Policy</a>
            <a href="/terms" className="hover:text-green-600">Terms of Service</a>
          </div>
          <p className="mt-2">© {new Date().getFullYear()} TreeMapper. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}