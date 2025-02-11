import React from 'react'
import { useRouter } from 'solito/router'
import { Button, Stack, Text, YStack } from 'tamagui'
import { HeaderSkeleton } from '../../components/skeleton/header'
import { ContentSkeleton } from '../../components/skeleton/content'
import { SettingsTabs } from '../../components/skeleton/settings-tabs'

export default function SettingsIndexScreen() {
  const router = useRouter()

  return (
    <YStack flex={1} backgroundColor="$background">
      <HeaderSkeleton headerText="Settings" />
      <ContentSkeleton>
        <SettingsTabs />
      </ContentSkeleton>
    </YStack>
  )
}
