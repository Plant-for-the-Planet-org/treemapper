'use client'

import { useRouter } from 'next/navigation'
import { MemberManagementSection } from '@/app/dashboard/workspace/components/MemberManagementSection'

export default function WorkspaceMembersPage() {
  const router = useRouter()
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <MemberManagementSection goHome={() => router.push('/')} />
      </div>
    </div>
  )
}
