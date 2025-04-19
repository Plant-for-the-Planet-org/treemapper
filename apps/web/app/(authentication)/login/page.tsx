"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devUserMode, setDevUserMode] = useState(false);
  const [devUsername, setDevUsername] = useState("");

  // Google sign in handler
  const handleGoogleSignIn = () => {
    setLoading(true);
    signIn("google", { callbackUrl });
  };

  // Development bypass handler
  const handleDevBypass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("dev-bypass", {
        redirect: false,
        devUsername,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        // Redirect to the callback URL or dashboard if successful
        router.push(callbackUrl);
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden">
      {/* Left section with background image - 70% on desktop, full width on mobile */}
      <div className="hidden md:block md:w-[70%] h-full relative">
        <Image 
          src="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=2574&auto=format&fit=crop"
          alt="Forest background" 
          fill
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
            
            {error && (
              <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg">
                {error}
              </div>
            )}
            
            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 12h8"></path>
                <path d="M12 8v8"></path>
              </svg>
              {loading ? "Signing in..." : "Login / Sign up with Google"}
            </button>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Having problems logging in? <a href="mailto:support@treemapper.org" className="text-green-600 hover:text-green-800">Contact us</a>
              </p>
            </div>

            {/* Development options - hidden in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Development Options</span>
                  </div>
                </div>
                
                {!devUserMode ? (
                  <button
                    onClick={() => setDevUserMode(true)}
                    className="w-full mt-4 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100"
                  >
                    Use Development Bypass
                  </button>
                ) : (
                  <form onSubmit={handleDevBypass} className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="devUsername" className="block text-sm font-medium text-gray-700">
                        Development Username
                      </label>
                      <input
                        id="devUsername"
                        name="devUsername"
                        type="text"
                        placeholder="Enter any name (for development only)"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        value={devUsername}
                        onChange={(e) => setDevUsername(e.target.value)}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        This bypass is for development purposes only and will be removed in production.
                      </p>
                    </div>
                    
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setDevUserMode(false)}
                        className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {loading ? "Signing in..." : "Continue"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
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