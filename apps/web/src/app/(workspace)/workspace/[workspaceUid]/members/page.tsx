'use client'

import { MemberManagementSection } from '@/app/dashboard/workspace/components/MemberManagementSection'

export default function WorkspaceMembersPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-full mx-auto">
        <MemberManagementSection />
      </div>
    </div>
  )
}
