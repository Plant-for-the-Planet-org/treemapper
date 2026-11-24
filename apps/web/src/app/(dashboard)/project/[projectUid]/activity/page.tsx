'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { Lock } from 'lucide-react'
import useProjectStore from '@shared-core/store/useProjectStore'
import { isProjectAdmin } from '@/lib/projectAccess'
import { ActivityAuditSection } from '@/app/dashboard/workspace/components/ActivityAuditSection'

// The project's full activity log, for its owner and admins, matching
// `@ProjectRoles('owner', 'admin')` on GET /projects/:id/audit-logs. The
// sidebar hides the entry for everyone else; this repeats the check so a direct
// URL gets a plain "you cannot open this" instead of an error banner. A UX
// gate only: the server decides what anyone gets.
export default function ProjectActivityPage() {
  const { projectUid } = useParams<{ projectUid: string }>()
  const project = useProjectStore(s => s.projects).find(p => p.uid === projectUid)

  if (!isProjectAdmin(project?.userRole)) {
    return (
      <div className="w-full flex-1 min-h-0 flex items-center justify-center bg-muted/30 p-6">
        <div className="max-w-sm rounded-xl border border-border bg-background px-6 py-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
            <Lock size={18} className="text-muted-foreground" />
          </div>
          <h2 className="text-[15px] font-semibold text-foreground">You cannot open the activity log</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            The activity log is limited to this project&apos;s owner and admins.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <ActivityAuditSection scope="project" projectUid={projectUid} title="Activity log" />
      </div>
    </div>
  )
}
