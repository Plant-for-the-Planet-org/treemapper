import React from 'react'
import { Avatar, XStack } from 'tamagui'

function UserAvatar() {
  return (
    <XStack alignItems="center" gap="$6" top="$13"
    style={{position:'absolute',right:20}}>
      <Avatar circular size="$5">
        <Avatar.Image
          accessibilityLabel="Nate Wienert"
          src="https://avatar.iran.liara.run/public/12"
        />
        <Avatar.Fallback delayMs={600} backgroundColor="$blue10" />
      </Avatar>
    </XStack>
  )
}

export default UserAvatar