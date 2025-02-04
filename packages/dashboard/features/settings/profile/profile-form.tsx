import React from 'react'
import { Button, Form, Input, Label, YStack } from 'tamagui'

export default function ProfileForm() {
  return (
    <YStack>
      <Form
        onSubmit={() => {
          console.log('submit')
        }}>
        <YStack>
          <Label>Name</Label>
          <Input />
        </YStack>
        <YStack marginTop="$8">
          <Button>Submit</Button>
        </YStack>
      </Form>
    </YStack>
  )
}
