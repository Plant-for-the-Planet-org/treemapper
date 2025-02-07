import React from 'react'
import { Button, H3, XStack, Image } from 'tamagui'
import { useNavigation } from '@react-navigation/native'

const BackIcon = require('../../../public/images/back.png')

type HeaderSkeletonProps = {
  headerText: string
}

export function HeaderSkeleton({ headerText }: HeaderSkeletonProps) {
  const navigation = useNavigation()

  return (
    <XStack alignItems="center" gap="$2" paddingTop="$5">
      <Button
        size="$4"
        paddingHorizontal="$2"
        chromeless
        onPress={() => { navigation.goBack() }}
      >
        <Image src={BackIcon} />
      </Button>
      <H3>{headerText}</H3>
    </XStack>
  )
}
