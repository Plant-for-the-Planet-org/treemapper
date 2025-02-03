import React from 'react'
import { useRouter } from 'solito/router'
import { H2, Text, YStack } from 'tamagui'
import { ContentSkeleton } from '../../../components/skeleton/content'
import { HeaderSkeleton } from '../../../components/skeleton/header'
import MembersList from './members-list'
import InviteMember from './invite-member'

export default function MembersScreen() {
  const router = useRouter()

  return (
    <YStack>
      <HeaderSkeleton headerText="Members" />
      <ContentSkeleton>
        <InviteMember />
        <MembersList />
      </ContentSkeleton>
    </YStack>
  )
}
