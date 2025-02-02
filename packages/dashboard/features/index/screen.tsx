import React from 'react'
import { YStack } from 'tamagui'
import { ContentSkeleton } from '../../components/skeleton/content'
import { DashboardTabs } from '../../components/skeleton/dashboard-tabs'

export default function DashboardIndexScreen() {
  return (
    <YStack flex={1} backgroundColor="$background">
      <ContentSkeleton>
        <DashboardTabs />
      </ContentSkeleton>
    </YStack>
  )
}
