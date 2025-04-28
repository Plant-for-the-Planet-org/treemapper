import React from 'react';

const ProfileAvatar = ({
  imageUrl = '/api/placeholder/200/200',
  altText = 'Profile picture',
  border = false,
  borderColor = 'blue-500',
  openProfileSetting
}) => {
  return (
    <div className="relative inline-block">
      {/* Profile Image - responsive medium size */}
      <div
        onClick={openProfileSetting}
        className={`
          h-10 w-10 sm:h-8 sm:w-8 md:h-12 md:w-12
          ${border ? `border-2 border-${borderColor}` : ''}
          rounded-full overflow-hidden
          cursor-pointer
        `}
      >
        <img
          src={imageUrl}
          alt={altText}
          className="object-cover w-full h-full"
        />
      </div>
    </div>
  );
};

export default ProfileAvatar;