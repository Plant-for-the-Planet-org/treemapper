'use client'

import type { ReactNode } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import useProjectStore from '@shared-core/store/useProjectStore'
import { Button } from '@/components/ui/button'
import { isProjectAdmin } from '@/lib/projectAccess'
import type { ProjectRole } from '@/lib/projectAccess'

/**
 * Hides a page from project members whose role is not allowed to see it.
 *
 * This is a UX gate, not the security boundary. The routes behind these pages
 * carry `@ProjectRoles(...)`, and that is what actually protects the data; this
 * only avoids showing someone a screen that would fail every request it makes.
 *
 * Safe to read the role straight from the store: `project/[projectUid]/layout`
 * blocks rendering until the store's selected project matches the uid in the
 * URL, so by the time this runs the role belongs to the project on screen and
 * there is no window where a permitted user is briefly refused.
 */
export function ProjectRoleGate({
  allow = isProjectAdmin,
  label = 'This page',
  children,
}: {
  /** Predicate over the current project role. Defaults to owner or admin. */
  allow?: (role: ProjectRole) => boolean
  /** Named in the refusal message, e.g. "The Data Explorer". */
  label?: string
  children: ReactNode
}) {
  const router = useRouter()
  const { projectUid } = useParams<{ projectUid: string }>()
  const role = useProjectStore((state) => state.selectedProject?.userRole)

  if (allow(role)) return <>{children}</>

  return (
    // Same flex-child rules as a page: h-full does not resolve inside the
    // layout's flex column, so claim the space with flex-1 instead.
    <div className="flex w-full flex-1 min-h-0 flex-col items-center justify-center gap-4 p-8 text-center">
      <ShieldAlert className="h-8 w-8 text-muted-foreground" />
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">You do not have access</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {label} is available to project owners and admins. Your role on this project is{' '}
          <span className="font-medium text-foreground">{role || 'unknown'}</span>. Ask an owner or
          admin if you need access.
        </p>
      </div>
      <Button variant="outline" onClick={() => router.push(`/project/${projectUid}/overview`)}>
        Go to project overview
      </Button>
    </div>
  )
}
