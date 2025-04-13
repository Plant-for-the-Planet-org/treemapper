import React from 'react'
import { useRouter } from 'solito/navigation'
import { H1, YStack } from 'tamagui'
import { ContentSkeleton } from '../../components/skeleton/content'

import { HeaderSkeleton } from '../../components/skeleton/header'

export default function TeamsScreen() {
  const router = useRouter()

  return (
    <YStack flex={1} backgroundColor="$background">
      <HeaderSkeleton headerText="Teams" />
      <ContentSkeleton>
        <H1>Teams</H1>
      </ContentSkeleton>
    </YStack>
  )
}
