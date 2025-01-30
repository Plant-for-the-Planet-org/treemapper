import React from 'react'
import { Text, YStack } from 'tamagui'
import { HeaderSkeleton } from '../../components/skeleton/header'
import { ContentSkeleton } from '../../components/skeleton/content'
import { PrimaryTabs } from '../../components/skeleton/primary-tabs'

export function DashboardIndexScreen() {
  return (
    <YStack flex={1} backgroundColor="$background">
      <HeaderSkeleton />
      <ContentSkeleton>
        <PrimaryTabs />
      </ContentSkeleton>
    </YStack>
  )
}
