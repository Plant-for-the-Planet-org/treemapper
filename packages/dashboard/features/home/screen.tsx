import React from 'react'
import {Button, Input, Text, XStack, YStack} from 'tamagui'

export function HomeScreen() {
  return (
    <YStack flex={1} padding="$4" backgroundColor="$background">
      {/* Header Section */}
      <XStack
        justifyContent="space-between"
        alignItems="center"
        marginBottom="$4">
        <Text fontSize="$6" fontWeight="bold">
          My App
        </Text>
        <Button size="$3" variant="outlined">
          Menu
        </Button>
      </XStack>

      {/* Content Section */}
      <YStack space="$4" flex={1}>
        <Text fontSize="$5" fontWeight="bold">
          Welcome Back
        </Text>

        <Input size="$4" placeholder="Search..." marginTop="$2" />

        {/* Card-like container */}
        <YStack
          backgroundColor="$gray3"
          padding="$4"
          borderRadius="$4"
          marginTop="$2">
          <Text fontSize="$4" marginBottom="$2">
            Featured Content
          </Text>
          <Text color="$gray11">
            This is a sample card with some content. You can add more components
            and style them according to your needs.
          </Text>
        </YStack>

        {/* Action Buttons */}
        <XStack space="$3" marginTop="$4">
          <Button flex={1} size="$4" theme="blue">
            Get Started
          </Button>
          <Button flex={1} size="$4" variant="outlined">
            Learn More
          </Button>
        </XStack>
      </YStack>

      {/* Footer */}
      <XStack justifyContent="center" paddingVertical="$4">
        <Text color="$gray11" fontSize="$3">
          © 2025 My App
        </Text>
      </XStack>
    </YStack>
  )
}
