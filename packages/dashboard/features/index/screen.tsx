import React from 'react'
import { YStack } from 'tamagui'
import { ContentSkeleton } from '../../components/skeleton/content'
import { DashboardTabs } from '../../components/skeleton/dashboard-tabs'
import { HeaderSkeleton } from '../../components/skeleton/header'

export default function DashboardIndexScreen() {
  return (
    <YStack flex={1} backgroundColor="$background">
    <HeaderSkeleton headerText="Dashboard" />
      <ContentSkeleton>
        <DashboardTabs />
      </ContentSkeleton>
    </YStack>
  )
}
