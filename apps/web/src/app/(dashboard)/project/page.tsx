'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useProjectStore from '@shared-core/store/useProjectStore'
import { useUserStore } from '@shared-core/store/useUserStore'
import { projectHref } from '@/lib/projectRoutes'
import Spinner from '@/component/Spinner'

// `/project` has no resource — resolve it to the user's primary (or selected)
// project's overview. Falls back to onboarding if the user has no project.
export default function ProjectIndexRedirect() {
  const router = useRouter()
  const selectedProject = useProjectStore(state => state.selectedProject)
  const projects = useProjectStore(state => state.projects)
  const user = useUserStore(state => state.user)

  useEffect(() => {
    if (selectedProject?.uid) {
      router.replace(projectHref(selectedProject.uid, 'overview'))
      return
    }
    if (user?.primaryProjectUid) {
      router.replace(projectHref(user.primaryProjectUid, 'overview'))
      return
    }
    const fallback = projects?.[0]?.uid
    if (fallback) {
      router.replace(projectHref(fallback, 'overview'))
      return
    }
    if (user && !user.primaryWorkspaceUid) {
      router.replace('/onboard')
    }
  }, [router, selectedProject, projects, user])

  return (
    <div className="h-full w-full flex items-center justify-center">
      <Spinner />
    </div>
  )
}
