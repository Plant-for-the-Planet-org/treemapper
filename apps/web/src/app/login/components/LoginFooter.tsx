import { LoginFooterProps } from "@shared-core/types/interface.app";

export const LoginFooter: React.FC<LoginFooterProps> = ({ onImprintClick, onPolicyClick, onTermsClick }) => {
  return (
    <footer className="absolute bottom-0 left-0 right-0 p-6 text-center">
      <nav className="flex justify-center items-center gap-6 mb-2">
        <button
          onClick={onImprintClick}
          className="text-sm text-gray-600 hover:text-[#007A49] transition-colors"
        >
          Imprint
        </button>
        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
        <button
          onClick={onPolicyClick}
          className="text-sm text-gray-600 hover:text-[#007A49] transition-colors"
        >
          Privacy
        </button>
        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
        <button
          onClick={onTermsClick}
          className="text-sm text-gray-600 hover:text-[#007A49] transition-colors"
        >
          Terms
        </button>
      </nav>
      <p className="text-xs text-gray-500">
        © {new Date().getFullYear()} TreeMapper by Plant-for-the-Planet. All rights reserved.
      </p>
    </footer>
  );
};