import React from 'react'
import { Button, Form, Input, Label, YStack, Text } from 'tamagui'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../provider/api'

export default function ProfileForm() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['user.me'],
    queryFn: async () => await apiClient.get('/api/users/me'),
  })

  const user = data?.user

  return (
    <YStack>
      <Form
        onSubmit={() => {
          console.log('submit')
        }}>
        <YStack>
          <Label>Name</Label>
          <Input value={user?.fullName} />
        </YStack>
        <YStack marginTop="$8">
          <Button>Submit</Button>
        </YStack>
        <Text>{JSON.stringify(data, null, 2)}</Text>
      </Form>
    </YStack>
  )
}
