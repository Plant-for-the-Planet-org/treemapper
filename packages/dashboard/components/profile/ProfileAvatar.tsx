import React from 'react'
import { Avatar, XStack } from 'tamagui'
import { useRouter } from 'solito/router'

function UserAvatar() {
  const router = useRouter()
  const handleNav = () => {
    router.push('/dashboard/me')
  }
  return (
    <Avatar circular size="$5" onPress={handleNav}>
      <Avatar.Image
        accessibilityLabel="Nate Wienert"
        src="https://avatar.iran.liara.run/public/3"
      />
      <Avatar.Fallback delayMs={300} backgroundColor="$gray5" />
    </Avatar>
  )
}

export default UserAvatar