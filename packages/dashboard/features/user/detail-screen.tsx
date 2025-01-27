import { YStack, Text } from 'tamagui'
import { createParam } from 'solito'
import { TextLink } from 'solito/link'
import React from 'react'

const { useParam } = createParam<{ id: string }>()

export function UserDetailScreen() {
  const [id] = useParam('id')

  return (
    <YStack f={1} jc="center" ai="center" space="$4">
      <Text ta="center" fontWeight="bold">
        {`User ID: ${id}`}
      </Text>

      <TextLink 
        href="/"
        textProps={{
          fontSize: "$6"
        }}
      >
        👈 Go Home
      </TextLink>
    </YStack>
  )
}