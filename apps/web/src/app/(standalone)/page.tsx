'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useProjectStore from '@shared-core/store/useProjectStore'
import { useUserStore } from '@shared-core/store/useUserStore'
import Spinner from '@/component/Spinner'

// Authenticated landing. Resolves the active/primary project and sends the
// user to its overview. If an invite param is present, the global invite modal
// (in the layout) handles it, so we stay put. A user with no project is routed
// to /onboard by the layout bootstrap.
export default function Landing() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedProject = useProjectStore(state => state.selectedProject)
  const primaryProjectUid = useUserStore(state => state.user?.primaryProjectUid)

  const hasInvite = !!(searchParams.get('project-invite') || searchParams.get('project-link'))

  useEffect(() => {
    if (hasInvite) return
    const uid = selectedProject?.uid ?? primaryProjectUid
    if (uid) router.replace(`/project/${uid}/overview`)
  }, [hasInvite, selectedProject, primaryProjectUid, router])

  return (
    <div className="h-full w-full flex items-center justify-center">
      <Spinner />
    </div>
  )
}
