import React from 'react'
import { createParam } from 'solito'
import { useRouter } from 'solito/navigation'
import { YStack } from 'tamagui'
import { ContentSkeleton } from '../../../components/skeleton/content'
import { HeaderSkeleton } from '../../../components/skeleton/header'

type Params = {
  memberId: string
}

const { useParams } = createParam<Params>()

export default function SingleMemberScreen() {
  const router = useRouter()
  const { params, setParams } = useParams()

  return (
    <YStack flex={1} backgroundColor="$background">
      <HeaderSkeleton headerText={`Member ${params.memberId}`} />
      <ContentSkeleton></ContentSkeleton>
    </YStack>
  )
}
