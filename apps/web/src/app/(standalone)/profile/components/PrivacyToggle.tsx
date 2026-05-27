import { EyeOff, Eye } from "lucide-react";

export const PrivacyToggle = ({ profile, onChange }) => {
  return (
    <div className="flex items-center justify-between p-6 rounded-2xl bg-stone-50/50 hover:bg-stone-100/50 transition-all duration-300 border border-stone-200/50">
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-xl transition-colors duration-300 ${
          profile.isPrivate ? 'bg-stone-200' : 'bg-[#007A49]/10'
        }`}>
          {profile.isPrivate ? (
            <EyeOff size={20} className="text-stone-600" />
          ) : (
            <Eye size={20} className="text-[#007A49]" />
          )}
        </div>
        <div>
          <p className="font-semibold text-stone-800">Private Profile</p>
          <p className="text-sm text-stone-600">
            {profile.isPrivate
              ? "Your profile is private and only visible to you"
              : "Your profile is public and visible to everyone"
            }
          </p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          name="isPrivate"
          checked={profile.isPrivate}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className={`w-12 h-6 rounded-full transition-all duration-300 peer-focus:ring-4 peer-focus:ring-[#007A49]/20 ${
          profile.isPrivate ? 'bg-[#007A49]' : 'bg-stone-300'
        } peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm`}></div>
      </label>
    </div>
  );
};
