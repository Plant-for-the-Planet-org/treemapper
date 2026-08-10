import { LoginFormProps } from "@shared-core/types/interface.app";
import { Loader2, Mail, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

// Google "G" mark (full color)
const GoogleIcon = () => (
  <svg className="size-[22px]" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M19.8 10.2273C19.8 9.51818 19.7364 8.83636 19.6182 8.18182H10.2V12.05H15.6109C15.3818 13.3 14.6727 14.3591 13.6091 15.0682V17.5773H16.8273C18.7091 15.8364 19.8 13.2727 19.8 10.2273Z" fill="#4285F4" />
    <path d="M10.2 20C12.9 20 15.1636 19.1045 16.8273 17.5773L13.6091 15.0682C12.7091 15.6682 11.5636 16.0227 10.2 16.0227C7.59545 16.0227 5.38182 14.2636 4.58636 11.9H1.25455V14.4909C2.90909 17.7591 6.30909 20 10.2 20Z" fill="#34A853" />
    <path d="M4.58636 11.9C4.39091 11.3 4.27727 10.6591 4.27727 10C4.27727 9.34091 4.39091 8.7 4.58636 8.1V5.50909H1.25455C0.572727 6.85909 0.2 8.38636 0.2 10C0.2 11.6136 0.572727 13.1409 1.25455 14.4909L4.58636 11.9Z" fill="#FBBC05" />
    <path d="M10.2 3.97727C11.6818 3.97727 13.0091 4.48182 14.0636 5.47273L16.9182 2.61818C15.1591 0.981818 12.8955 0 10.2 0C6.30909 0 2.90909 2.24091 1.25455 5.50909L4.58636 8.1C5.38182 5.73636 7.59545 3.97727 10.2 3.97727Z" fill="#EA4335" />
  </svg>
);

// Facebook "f" mark (brand blue)
const FacebookIcon = () => (
  <svg className="size-[22px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.469h-2.796v8.385C19.612 22.954 24 17.99 24 12z" fill="#1877F2" />
  </svg>
);

// Apple mark
const AppleIcon = () => (
  <svg className="size-[22px]" viewBox="0 0 24 24" fill="#0F1F17" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.37-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const socials = [
  { id: 'google-oauth2', label: 'Google', icon: GoogleIcon },
  { id: 'facebook', label: 'Facebook', icon: FacebookIcon },
  { id: 'apple', label: 'Apple', icon: AppleIcon },
];

export const LoginForm: React.FC<LoginFormProps> = ({ loading, onLogin }) => {
  const busy = loading !== false;

  return (
    <div className="rounded-[12px] border border-[#007A49]/10 bg-white p-8 shadow-xl shadow-[#007A49]/[0.06]">
      <div className="mb-7">
        <h2 className="text-2xl font-bold tracking-tight text-[#0F1F17]">Welcome back</h2>
        <p className="mt-1 text-sm text-[#5A6B61]">Sign in to monitor your restoration work.</p>
      </div>

      {/* Primary: email / password via Auth0 universal login */}
      <Button
        onClick={() => onLogin('auth0')}
        disabled={busy}
        className="h-12 w-full rounded-[20px] bg-[#007A49] text-base font-semibold text-white shadow-sm hover:bg-[#006B3F] focus-visible:ring-[#007A49]/40"
      >
        {loading === 'auth0' ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <Mail className="size-5" />
            <span>Continue with email</span>
          </>
        )}
      </Button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#E4EFE8]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-medium uppercase tracking-wide text-[#9CAFA3]">
            Or continue with
          </span>
        </div>
      </div>

      {/* Social providers */}
      <div className="grid grid-cols-3 gap-3">
        {socials.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant="outline"
            onClick={() => onLogin(id)}
            disabled={busy}
            aria-label={`Continue with ${label}`}
            className="h-auto flex-col gap-2 rounded-[20px] border-[#E4EFE8] bg-white py-3.5 hover:border-[#007A49]/30 hover:bg-[#F6FAF7]"
          >
            {loading === id ? (
              <Loader2 className="size-[22px] animate-spin text-[#5A6B61]" />
            ) : (
              <Icon />
            )}
            <span className="text-xs font-medium text-[#3C4F44]">{label}</span>
          </Button>
        ))}
      </div>

      {/* Documentation */}
      <Button
        asChild
        variant="ghost"
        className="mt-6 h-auto w-full rounded-[20px] py-2.5 text-sm font-medium text-[#007A49] hover:bg-[#007A49]/5 hover:text-[#006B3F]"
      >
        <a href="https://docs.treemapper.app/en" target="_blank" rel="noopener noreferrer">
          <BookOpen className="size-4" />
          <span>Read the documentation</span>
        </a>
      </Button>

      {/* Help link */}
      {/* <div className="text-center pt-2">
        <p className="text-sm text-gray-600">
          Need help?{' '}
          <a
            href="https://www.plant-for-the-planet.org/contact/"
            className="text-[#007A49] hover:text-[#006B3F] font-medium transition-colors"
          >
            Contact support
          </a>
        </p>
      </div> */}
    </div>
  );
};
