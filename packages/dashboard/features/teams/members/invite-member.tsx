import React from 'react'
import { Button, Card, CardHeader, H6, YStack } from 'tamagui'

export default function InviteMember() {
  return (
    <Card>
      <CardHeader>
        <H6>Invite Members to the Project</H6>
      </CardHeader>
      <YStack gap="$2">
        <Button>Invite</Button>
      </YStack>
    </Card>
  )
}
