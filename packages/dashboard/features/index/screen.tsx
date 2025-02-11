import React from 'react'
import { YStack } from 'tamagui'
import { ContentSkeleton } from '../../components/skeleton/content'
import { DashboardTabs } from '../../components/skeleton/dashboard-tabs'
import { HeaderSkeleton } from '../../components/skeleton/header'
import ProjectDetails from '../../components/projects/projects'
import { ApiClient } from '../../../api/client'

export default function DashboardIndexScreen() {
  ApiClient.initialize({
    baseUrl: 'http://192.168.1.3:3000', //Update this to you local ip
    headers: {
      'X-Custom-Header': 'value',
    },
  })
  return (
    <YStack flex={1} backgroundColor="$background" paddingTop="$5">
      <HeaderSkeleton headerText="Dashboard" />
      <ProjectDetails />
      <ContentSkeleton>
        <DashboardTabs />
      </ContentSkeleton>
    </YStack>
  )
}
