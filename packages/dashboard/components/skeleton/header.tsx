import React from 'react'
import { Button, H3, XStack, Image } from 'tamagui'
import { useRouter } from 'solito/router'

const BackIcon = require('../../../public/images/back.png')

type HeaderSkeletonProps = {
  headerText: string
}

export function HeaderSkeleton({ headerText }: HeaderSkeletonProps) {
  const router = useRouter()
  const handleBack = () => {

      router.back()
  }
  return (
    <XStack alignItems="center" gap="$2" paddingTop="$5">
      <Button
        size="$4"
        paddingHorizontal="$2"
        chromeless
        onPress={handleBack}
      >
        <Image src={BackIcon} />
      </Button>
      <H3>{headerText}</H3>
    </XStack>
  )
}
