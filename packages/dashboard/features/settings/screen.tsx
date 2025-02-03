import { ArrowLeft } from '@tamagui/lucide-icons'
import React from 'react'
import { useRouter } from 'solito/router'
import { Button, Stack, Text, YStack } from 'tamagui'
import { ContentSkeleton } from '../../components/skeleton/content'
import { SettingsTabs } from '../../components/skeleton/settings-tabs'

export default function SettingsIndexScreen() {
  const router = useRouter()

  return (
    <YStack flex={1} backgroundColor="$background">
      <Stack
        flexDirection="row"
        alignItems="center"
        paddingHorizontal="$1"
        paddingTop="$5">
        <Button
          size="$5"
          padding="$2"
          circular
          // icon={ArrowLeft}
          backgroundColor="transparent"
          onPress={() => router.back()}
          pressStyle={{
            backgroundColor: '$gray4',
            scale: 0.97,
          }}
        />
        <Text fontSize="$6" fontWeight="bold">
          Settings
        </Text>
      </Stack>
      <ContentSkeleton>
        <SettingsTabs />
      </ContentSkeleton>
    </YStack>
  )
}
