import { ArrowLeft, LogOut } from "lucide-react";
import {useRouter} from "next/navigation";

export const Header = ({ onLogout }) => {
  const { back } = useRouter();
  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-stone-200/50 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={back}
              className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="ml-4 text-xl font-semibold text-stone-900">Profile Settings</h1>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};