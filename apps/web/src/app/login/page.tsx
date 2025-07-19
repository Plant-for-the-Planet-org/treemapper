"use client";

import React, { useState, useCallback } from 'react';
import { useSearchParams } from "next/navigation";
import { Loader2, Smartphone, TreePine, Shield, Users, BarChart3, Globe, Zap, Award } from 'lucide-react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(() => {
    setLoading(true);
    // Redirect to Auth0 login with returnTo parameter if it exists
    window.location.href = returnTo
      ? `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`
      : '/api/auth/login';
  }, [returnTo]);

  const openImprint = useCallback(() => {
    window.open("https://www.plant-for-the-planet.org/imprint/#:~:text=The%20Plant%2Dfor%2Dthe%2DPlanet%20Foundation%20is%20a%20legally,Your%20donation%20is%20tax%20deductible", '_blank', 'noopener,noreferrer');
  }, []);

  const openPolicy = useCallback(() => {
    window.open('https://www.plant-for-the-planet.org/privacy-terms/', '_blank', 'noopener,noreferrer');
  }, []);

  const openTerms = useCallback(() => {
    window.open('https://www.plant-for-the-planet.org/terms-and-conditions/', '_blank', 'noopener,noreferrer');
  }, []);

  const openPlayStore = useCallback(() => {
    window.open('https://play.google.com/store/apps/details?id=org.pftp.treemapper', '_blank', 'noopener,noreferrer');
  }, []);

  const openAppStore = useCallback(() => {
    window.open('https://apps.apple.com/in/app/treemapper/id1524353784', '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-green-100/40 to-emerald-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-tr from-emerald-100/40 to-green-100/40 rounded-full blur-3xl"></div>
      </div>

      <div className="relative min-h-screen flex">
        {/* Left side - Branding and features */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-center px-12 xl:px-20">
          <div className="max-w-2xl">
            {/* Logo and main heading */}
            <div className="mb-12">
              <div className="flex items-center mb-8">
                <div className="mb-4 flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#007A49] to-emerald-600 rounded-2xl mr-4 shadow-lg">
                  <TreePine className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900" style={{margin:0, padding:0}}>TreeMapper</h1>
                  <p className="text-lg text-gray-600 mt-1">
                    The free monitoring tool for forest restoration programs
                  </p>
                </div>
              </div>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-1 gap-6 mb-12">
              <div className="flex items-start space-x-4 p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm">
                <div className="flex items-center justify-center w-12 h-12 bg-[#007A49]/10 rounded-xl">
                  <Globe className="w-6 h-6 text-[#007A49]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Global Impact</h3>
                  <p className="text-gray-600">Connect with restoration projects worldwide and track environmental impact in real-time.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm">
                <div className="flex items-center justify-center w-12 h-12 bg-[#007A49]/10 rounded-xl">
                  <Zap className="w-6 h-6 text-[#007A49]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Monitoring</h3>
                  <p className="text-gray-600">Advanced analytics and AI-powered insights to optimize your restoration efforts.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm">
                <div className="flex items-center justify-center w-12 h-12 bg-[#007A49]/10 rounded-xl">
                  <Award className="w-6 h-6 text-[#007A49]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Driven</h3>
                  <p className="text-gray-600">Join thousands of conservationists making a measurable difference for our planet.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col justify-center items-center px-8 py-12 lg:px-12">
          <div className="w-full max-w-md space-y-8">
            
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#007A49] to-emerald-600 rounded-2xl mr-4 shadow-lg">
                  <TreePine className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-3xl font-bold text-gray-900" style={{margin:0, padding:0}}>TreeMapper</h1>
                  <p className="text-gray-600 mt-1">Forest restoration monitoring</p>
                </div>
              </div>
            </div>

            {/* Login card */}
            <div className="backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl p-8 space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Authorize</h2>
                <p className="text-gray-600">Sign in to continue to TreeMapper</p>
              </div>

              {/* Trust indicators */}
              <div className="flex justify-center space-x-8">
                <div className="text-center">
                  <Shield className="w-6 h-6 text-[#007A49] mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-600">Secure</p>
                </div>
                <div className="text-center">
                  <Users className="w-6 h-6 text-[#007A49] mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-600">Trusted</p>
                </div>
                <div className="text-center">
                  <BarChart3 className="w-6 h-6 text-[#007A49] mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-600">Analytics</p>
                </div>
              </div>

              {/* Login button */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-[#007A49] hover:bg-[#006B3F] text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#007A49] focus:outline-none focus:ring-4 focus:ring-[#007A49]/20"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Login | Singup"
                )}
              </button>

              {/* Help link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Need help?{' '}
                  <a
                    href="https://www.plant-for-the-planet.org/contact/"
                    className="text-[#007A49] hover:text-[#006B3F] font-medium transition-colors"
                  >
                    Contact support
                  </a>
                </p>
              </div>
            </div>

            {/* App download section */}
            <div className="backdrop-blur-xl bg-white/50 border border-white/20 rounded-3xl shadow-xl p-6">
              <div className="flex items-center mb-4">
                <div className="mb-4 flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[#007A49] to-emerald-600 rounded-xl mr-3">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900" style={{margin:0, padding:0}}>Get the mobile app</h3>
                  <p className="text-sm text-gray-600">Monitor on the go</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={openPlayStore}
                  className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-xl transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-gray-900/20"
                >
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.92 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-md font-semibold">Google Play</div>
                  </div>
                </button>

                <button
                  onClick={openAppStore}
                  className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-xl transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-gray-900/20"
                >
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.19 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-md font-semibold">App Store</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-6 text-center">
        <nav className="flex justify-center items-center gap-6 mb-2">
          <button
            onClick={openImprint}
            className="text-sm text-gray-600 hover:text-[#007A49] transition-colors"
          >
            Imprint
          </button>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <button
            onClick={openPolicy}
            className="text-sm text-gray-600 hover:text-[#007A49] transition-colors"
          >
            Privacy
          </button>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <button
            onClick={openTerms}
            className="text-sm text-gray-600 hover:text-[#007A49] transition-colors"
          >
            Terms
          </button>
        </nav>
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} TreeMapper. All rights reserved.
        </p>
      </footer>
    </div>
  );
}