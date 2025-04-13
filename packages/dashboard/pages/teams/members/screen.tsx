import React from 'react'
import { useRouter } from 'solito/navigation'
import { H2, ScrollView, Text, View, YStack } from 'tamagui'
import { ContentSkeleton } from '../../../components/skeleton/content'
import { HeaderSkeleton } from '../../../components/skeleton/header'
import MembersList from './members-list'
import InviteMember from './invite-member'

export default function MembersScreen() {
  const router = useRouter()

  return (
    <YStack>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <InviteMember />
        <View paddingBottom="$5" />
        <MembersList />
      </ScrollView>
    </YStack>
  )
}
