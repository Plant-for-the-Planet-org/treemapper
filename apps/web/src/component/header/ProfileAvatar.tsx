import { useEffect } from "react";
import { useUserStore } from "@shared-core/store/useUserStore";
import { getMyDetails } from "@shared-core/fetchApi/api.fetch";
import { useToken } from "@/context/useTokenContext";
import { Leaf } from 'lucide-react';

const ProfileAvatar = ({
  altText = 'Profile picture',
  border = false,
  borderColor = 'blue-500',
  openProfileSetting
}) => {

  const { accessToken } = useToken()
  const User = useUserStore((state) => state.user);


  useEffect(() => {
    if (accessToken && !User) {
      fetchUser()
    }
  }, [])

  const fetchUser = async () => {
    try {
      const res = await getMyDetails(accessToken || '');
      if (res && res.statusCode !== 200) {
        throw new Error('Failed to fetch user')
      }
      useUserStore.getState().setUser(res.data)
    } catch (err) {
      console.error(err)
      useUserStore.getState().clearUser()
    }
  }

  return (
    <div className="relative inline-block">
      <div
        onClick={openProfileSetting}
        style={{ backgroundColor: '#E1EDE8' }}
        className={`
      h-10 w-10 sm:h-8 sm:w-8 md:h-12 md:w-12
      ${border ? `border-2 border-${borderColor}` : ''}
      rounded-full overflow-hidden
      cursor-pointer
      flex items-center justify-center
    `}
      >
        {User?.avatar ? (
          <img
            src={User.avatar}
            alt={altText}
            className="object-cover w-full h-full"
          />
        ) : (
          <Leaf className="text-green-600 w-5 h-5" />
        )}
      </div>
    </div>

  );
};

export default ProfileAvatar;