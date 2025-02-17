import React from 'react'
import { useRouter } from 'solito/router'
import { H2, Text, View, YStack } from 'tamagui'
import { ContentSkeleton } from '../../../components/skeleton/content'
import { HeaderSkeleton } from '../../../components/skeleton/header'
import MembersList from './members-list'
import InviteMember from './invite-member'

export default function MembersScreen() {
  const router = useRouter()

  return (
    <YStack>
      <ContentSkeleton>
        <InviteMember />
        <View paddingBottom="$5"/>
        <MembersList />
      </ContentSkeleton>
    </YStack>
  )
}
