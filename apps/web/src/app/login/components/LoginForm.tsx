import { LoginFormProps } from "@shared-core/types/interface.app";
import { Wifi, Database, BarChart3, Loader2 } from "lucide-react";
import { TrustIndicator } from "./TrustIndicator";

export const LoginForm: React.FC<LoginFormProps> = ({ loading, onLogin }) => {
  const trustIndicators = [
    { icon: Wifi, label: "Works Offline" },
    { icon: Database, label: "60k+ Species" },
    { icon: BarChart3, label: "Data Analytics" }
  ];

  return (
    <div className="backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl p-8 space-y-8">
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

      {/* Login button */}
      <button
        onClick={onLogin}
        disabled={loading}
        className="cursor-pointer w-full bg-[#007A49] hover:bg-[#006B3F] text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#007A49] focus:outline-none focus:ring-4 focus:ring-[#007A49]/20"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-3 ">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Signing in...</span>
          </div>
        ) : (
          "Login | Signup"
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
  );
};