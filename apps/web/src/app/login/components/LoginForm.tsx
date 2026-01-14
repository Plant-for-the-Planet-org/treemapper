import { LoginFormProps } from "@shared-core/types/interface.app";
import { Wifi, Database, BarChart3, Loader2, Mail, Apple } from "lucide-react";
import { TrustIndicator } from "./TrustIndicator";

// Google icon as SVG component
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.8 10.2273C19.8 9.51818 19.7364 8.83636 19.6182 8.18182H10.2V12.05H15.6109C15.3818 13.3 14.6727 14.3591 13.6091 15.0682V17.5773H16.8273C18.7091 15.8364 19.8 13.2727 19.8 10.2273Z" fill="#4285F4"/>
    <path d="M10.2 20C12.9 20 15.1636 19.1045 16.8273 17.5773L13.6091 15.0682C12.7091 15.6682 11.5636 16.0227 10.2 16.0227C7.59545 16.0227 5.38182 14.2636 4.58636 11.9H1.25455V14.4909C2.90909 17.7591 6.30909 20 10.2 20Z" fill="#34A853"/>
    <path d="M4.58636 11.9C4.39091 11.3 4.27727 10.6591 4.27727 10C4.27727 9.34091 4.39091 8.7 4.58636 8.1V5.50909H1.25455C0.572727 6.85909 0.2 8.38636 0.2 10C0.2 11.6136 0.572727 13.1409 1.25455 14.4909L4.58636 11.9Z" fill="#FBBC05"/>
    <path d="M10.2 3.97727C11.6818 3.97727 13.0091 4.48182 14.0636 5.47273L16.9182 2.61818C15.1591 0.981818 12.8955 0 10.2 0C6.30909 0 2.90909 2.24091 1.25455 5.50909L4.58636 8.1C5.38182 5.73636 7.59545 3.97727 10.2 3.97727Z" fill="#EA4335"/>
  </svg>
);

// Facebook icon as SVG component
const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 10C20 4.47715 15.5229 0 10 0C4.47715 0 0 4.47715 0 10C0 14.9912 3.65684 19.1283 8.4375 19.8785V12.8906H5.89844V10H8.4375V7.79688C8.4375 5.29063 9.93047 3.90625 12.2146 3.90625C13.3084 3.90625 14.4531 4.10156 14.4531 4.10156V6.5625H13.1922C11.95 6.5625 11.5625 7.3334 11.5625 8.125V10H14.3359L13.8926 12.8906H11.5625V19.8785C16.3432 19.1283 20 14.9912 20 10Z" fill="white"/>
  </svg>
);

export const LoginForm: React.FC<LoginFormProps> = ({ loading, onLogin }) => {
  const trustIndicators = [
    { icon: Wifi, label: "Works Offline" },
    { icon: Database, label: "60k+ Species" },
    { icon: BarChart3, label: "Data Analytics" }
  ];

  return (
    <div className="backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl p-8 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to TreeMapper</h2>
        <p className="text-gray-600">Sign in to start monitoring forest restoration</p>
      </div>

      {/* Trust indicators */}
      <div className="flex justify-center space-x-8">
        {trustIndicators.map((indicator, index) => (
          <TrustIndicator
            key={index}
            icon={indicator.icon}
            label={indicator.label}
          />
        ))}
      </div>

      {/* Login buttons */}
      <div className="space-y-3">
        {/* Email/Password Login */}
        <button
          onClick={() => onLogin('auth0')}
          disabled={loading}
          className="cursor-pointer w-full bg-[#007A49] hover:bg-[#006B3F] text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#007A49] focus:outline-none focus:ring-4 focus:ring-[#007A49]/20 flex items-center justify-center gap-3"
        >
          {loading === 'auth0' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <Mail className="w-5 h-5" />
              <span>Continue with Email</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white/90 text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Social login buttons */}
        <div className="space-y-2">
          {/* Google Login */}
          <button
            onClick={() => onLogin('google-oauth2')}
            disabled={loading !== false}
            className="cursor-pointer w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-200/50 flex items-center justify-center gap-3"
          >
            {loading === 'google-oauth2' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span>Google</span>
              </>
            )}
          </button>

          {/* Facebook Login */}
          <button
            onClick={() => onLogin('facebook')}
            disabled={loading !== false}
            className="cursor-pointer w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-200/50 flex items-center justify-center gap-3"
          >
            {loading === 'facebook' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <FacebookIcon />
                <span>Facebook</span>
              </>
            )}
          </button>

          {/* Apple Login */}
          <button
            onClick={() => onLogin('apple')}
            disabled={loading !== false}
            className="cursor-pointer w-full bg-black hover:bg-gray-900 text-white font-medium py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-gray-400/50 flex items-center justify-center gap-3"
          >
            {loading === 'apple' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Apple Login</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Help link */}
      <div className="text-center pt-2">
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
  );
};