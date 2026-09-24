'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { Lock } from 'lucide-react'
import useProjectStore from '@shared-core/store/useProjectStore'
import { isProjectAdmin } from '@/lib/projectAccess'
import DeviceManagement from './component/DeviceManagement'

// Device management is for the project's owner and admins, matching
// `@ProjectRoles('owner', 'admin')` on every route in DevicesController. The
// sidebar hides the entry for everyone else; this repeats the check so a direct
// URL gets the same answer instead of a red "Could not load devices" banner
// where a plain "you cannot open this" belongs. It wraps the screen rather than
// sitting inside it, so none of its requests fire for someone who may not make
// them.
//
// A UX gate, not the boundary: the server decides what anyone actually gets,
// and it is stricter in one way this cannot see (a workspace admin with no
// membership of this project may still be reported a role here).
//
// The project list is already in the store by the time this renders: the
// dashboard layout holds its children behind a spinner until it has loaded, so
// a missing project here means no access rather than "not yet".
export default function DeviceManagementPage() {
  const { projectUid } = useParams<{ projectUid: string }>()
  const myProjects = useProjectStore(s => s.projects)
  const project = myProjects.find(p => p.uid === projectUid)

  if (!isProjectAdmin(project?.userRole)) {
    return (
      <div className="w-full flex-1 min-h-0 flex items-center justify-center bg-muted/30 p-6">
        <div className="max-w-sm rounded-xl border border-border bg-background px-6 py-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
            <Lock size={18} className="text-muted-foreground" />
          </div>
          <h2 className="text-[15px] font-semibold text-foreground">You cannot open device management</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Seeing team devices and sending them notifications is limited to this
            project&apos;s owner and admins.
          </p>
        </div>
      </div>
    )
  }

  return <DeviceManagement />
}
