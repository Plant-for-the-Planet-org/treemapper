import React from 'react'
import { YStack } from 'tamagui'

export function ContentSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <YStack flexGrow={1} backgroundColor={'$gray4'}>
      {children}
    </YStack>
  )
}
