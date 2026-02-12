"use client";

import { useTranslation } from "react-i18next";
import { LoginFooterProps } from "@shared-core/types/interface.app";

export const LoginFooter: React.FC<LoginFooterProps> = ({ onImprintClick, onPolicyClick, onTermsClick }) => {
  const { t } = useTranslation();

  return (
    <footer className="absolute bottom-0 left-0 right-0 p-6 text-center">
      <nav className="flex justify-center items-center gap-6 mb-2">
        <button
          onClick={onImprintClick}
          className="text-sm text-gray-600 hover:text-[#007A49] transition-colors"
        >
          {t("login.imprint")}
        </button>
        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
        <button
          onClick={onPolicyClick}
          className="text-sm text-gray-600 hover:text-[#007A49] transition-colors"
        >
          {t("login.privacy")}
        </button>
        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
        <button
          onClick={onTermsClick}
          className="text-sm text-gray-600 hover:text-[#007A49] transition-colors"
        >
          {t("login.terms")}
        </button>
      </nav>
      <div className="flex justify-center items-center">
        <p className="text-xs text-gray-500">
          {t("login.copyright", { year: new Date().getFullYear() })}
        </p>
        <img src="/pftp-logo.svg" alt="Plant-for-the-Planet" className="w-4 h-4 ml-1" />
      </div>
    </footer>
  );
};