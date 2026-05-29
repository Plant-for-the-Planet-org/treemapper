'use client'

import { ApprovalsSection } from '@/app/dashboard/workspace/components/ApprovalsSection'

export default function WorkspaceApprovalsPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <ApprovalsSection />
      </div>
    </div>
  )
}
