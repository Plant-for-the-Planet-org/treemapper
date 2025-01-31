import React from 'react'
import { Button, Text, XStack } from 'tamagui'

type HeaderSkeletonProps = {
  headerText: string
}

export function HeaderSkeleton({ headerText }: HeaderSkeletonProps) {
  return (
    <XStack alignItems="center" marginTop="$4" paddingHorizontal="$4">
      <Button
        size="$4"
        paddingHorizontal="$2"
        paddingVertical="$0"
        chromeless
        // icon={<ArrowLeft />}
      />
      <Text fontSize="$7" marginLeft="$2" fontWeight="bold">
        {headerText}
      </Text>
    </XStack>
  )
}
