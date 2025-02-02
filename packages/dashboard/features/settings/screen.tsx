import React from 'react'
import { Text, YStack, Stack, Button } from 'tamagui'
import { HeaderSkeleton } from '../../components/skeleton/header'
import { ContentSkeleton } from '../../components/skeleton/content'
import { SettingsTabs } from '../../components/skeleton/settings-tabs'
import { useNavigation } from '@react-navigation/native'
import { ArrowLeft } from '@tamagui/lucide-icons'

export default function SettingsIndexScreen() {
  const navigation = useNavigation()

  return (
    <YStack flex={1} backgroundColor="$background">
      <Stack 
        flexDirection="row" 
        alignItems="center" 
        paddingHorizontal="$1"
        paddingTop="$5"
      >
        <Button
          size="$5"
          padding="$2"
          circular
          icon={ArrowLeft}
          backgroundColor="transparent"
          onPress={() => navigation.goBack()}
          pressStyle={{ 
            backgroundColor: '$gray4',
            scale: 0.97 
          }}
        />
        <Text fontSize="$6" fontWeight="bold">Settings</Text>
      </Stack>
      <ContentSkeleton>
        <SettingsTabs />
      </ContentSkeleton>
    </YStack>
  )
}