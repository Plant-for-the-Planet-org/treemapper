import { FooterProps } from "@shared-core/types/interface.app";

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 flex-shrink-0">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <span>© 2025 TreeMapper</span>
            <a href="#" className="hover:text-[#007A49] transition-colors">Help</a>
            <a href="#" className="hover:text-[#007A49] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#007A49] transition-colors">Terms</a>
          </div>
          <div className="text-sm text-gray-500 flex items-center space-x-2">
            <span>Made by Plant-for-the-Planet</span>
            <img src="/pftp-logo.svg" alt="Plant-for-the-Planet" className="w-4 h-4" />
          </div>
        </div>
      </div>
    </footer>
  );
};