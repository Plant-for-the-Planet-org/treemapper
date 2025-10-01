import { Loader, Upload } from "lucide-react";

export const AvatarUpload = ({ profile, onAvatarChange, isUploading, generateAnimalAvatar }) => {
  const avatarSrc = profile.image || generateAnimalAvatar(profile.email || 'default');
  
  return (
    <div className="flex flex-col items-center space-y-4 lg:w-1/3">
      <div className="relative group">
        <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-stone-100 shadow-lg bg-stone-50">
          <img
            src={avatarSrc}
            alt="Profile"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              e.target.src = generateAnimalAvatar(profile.email || 'fallback');
            }}
          />
        </div>
        <label
          htmlFor="avatar-upload"
          className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm"
        >
          {isUploading ? (
            <Loader size={24} className="text-white animate-spin" />
          ) : (
            <Upload size={24} className="text-white" />
          )}
          <input
            id="avatar-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={onAvatarChange}
            disabled={isUploading}
          />
        </label>
      </div>
      <p className="text-sm text-stone-500 text-center max-w-[180px]">
        {isUploading ? 'Uploading...' : 'Click to upload a new profile picture'}
      </p>
    </div>
  );
};
