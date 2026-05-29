import { Loader2, Upload } from 'lucide-react'

export const AvatarUpload = ({ profile, onAvatarChange, isUploading, generateAnimalAvatar }) => {
  const avatarSrc = profile.image || generateAnimalAvatar(profile.email || 'default')

  return (
    <div className="flex flex-col items-center gap-3 lg:w-1/3">
      <div className="relative group">
        <div className="w-28 h-28 rounded-2xl overflow-hidden border border-border bg-muted">
          <img
            src={avatarSrc}
            alt="Profile"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            referrerPolicy="no-referrer"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = generateAnimalAvatar(profile.email || 'fallback')
            }}
          />
        </div>
        <label
          htmlFor="avatar-upload"
          className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
        >
          {isUploading ? (
            <Loader2 size={20} className="text-white animate-spin" />
          ) : (
            <Upload size={20} className="text-white" />
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
      <p className="text-xs text-muted-foreground text-center max-w-[180px]">
        {isUploading ? 'Uploading...' : 'Click to upload a new profile picture'}
      </p>
    </div>
  )
}
