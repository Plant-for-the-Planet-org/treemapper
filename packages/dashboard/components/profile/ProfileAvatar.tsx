import React from 'react'
import { Avatar, XStack } from 'tamagui'

function UserAvatar() {
  return (
    <Avatar circular size="$5">
      <Avatar.Image
        accessibilityLabel="Nate Wienert"
        src="https://avatar.iran.liara.run/public/3"
      />
      <Avatar.Fallback delayMs={300} backgroundColor="$gray5" />
    </Avatar>
  )
}

export default UserAvatar