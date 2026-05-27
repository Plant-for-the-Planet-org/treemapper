'use client'

import { ActivityAuditSection } from '@/app/dashboard/workspace/components/ActivityAuditSection'

export default function WorkspaceActivityPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <ActivityAuditSection />
      </div>
    </div>
  )
}
