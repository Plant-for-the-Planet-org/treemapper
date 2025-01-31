import React from 'react'
import { Text, YStack } from 'tamagui'
import { HeaderSkeleton } from '../../components/skeleton/header'
import { ContentSkeleton } from '../../components/skeleton/content'
import { SettingsTabs } from '../../components/skeleton/settings-tabs'

export default function SettingsIndexScreen() {
  return (
    <YStack flex={1} backgroundColor="$background">
      <HeaderSkeleton headerText="Settings" />
      <ContentSkeleton>
        <SettingsTabs />
      </ContentSkeleton>
    </YStack>
  )
}
