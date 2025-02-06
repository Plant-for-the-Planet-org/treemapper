import React from 'react'
import { ScrollView, YStack } from 'tamagui'

export function ContentSkeleton({ children }: { children?: React.ReactNode }) {
  return <ScrollView>{children}</ScrollView>
}
