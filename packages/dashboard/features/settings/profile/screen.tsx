import React from 'react'
import { H1, YStack } from 'tamagui'
import ProfileForm from './profile-form'

export default function ProfileScreen() {
  return (
    <YStack>
      <H1>Profile</H1>
      <ProfileForm />
    </YStack>
  )
}
