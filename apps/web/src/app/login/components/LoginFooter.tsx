"use client";

import Image from 'next/image';
import { useTranslation } from "react-i18next";
import { LoginFooterProps } from "@shared-core/types/interface.app";
import pftpLogo from '@/assets/pftp-logo.svg';

export const LoginFooter: React.FC<LoginFooterProps> = ({ onImprintClick, onPolicyClick, onTermsClick }) => {
  const { t } = useTranslation();

  return (
    <footer className="mt-8 pt-6 text-center">
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
      <a
        href="https://www.plant-for-the-planet.org/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex justify-center items-center text-gray-500 hover:text-[#007A49] transition-colors"
      >
        <p className="text-xs">
          {t("login.copyright", { year: new Date().getFullYear() })}
        </p>
        <Image src={pftpLogo} alt="Plant-for-the-Planet" width={16} height={16} className="w-4 h-4 ml-1" />
      </a>
    </footer>
  );
};