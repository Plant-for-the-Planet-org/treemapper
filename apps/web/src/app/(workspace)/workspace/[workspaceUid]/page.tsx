'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Spinner from '@/component/Spinner'

// A bare workspace lands on General Settings.
export default function WorkspaceHomeRedirect() {
  const router = useRouter()
  const { workspaceUid } = useParams<{ workspaceUid: string }>()

  useEffect(() => {
    if (workspaceUid) router.replace(`/workspace/${workspaceUid}/general`)
  }, [workspaceUid, router])

  return (
    <div className="h-full w-full flex items-center justify-center">
      <Spinner />
    </div>
  )
}
