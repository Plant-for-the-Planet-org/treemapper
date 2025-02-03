import React from 'react'
import { H3, XStack } from 'tamagui'

type HeaderSkeletonProps = {
  headerText: string
}

export function HeaderSkeleton({ headerText }: HeaderSkeletonProps) {
  return (
    <XStack alignItems="center" gap="$2">
      {/* <Button
        size="$4"
        paddingHorizontal="$2"
        paddingVertical="$0"
        chromeless
        // icon={<ArrowLeft />}
      /> */}
      <H3>{headerText}</H3>
    </XStack>
  )
}
