'use client'

import { useRouter } from 'next/navigation'
import { useToken } from '@/context/useTokenContext'
import { ImpersonationSection } from '@/app/dashboard/workspace/components/ImpersonationSection'

export default function WorkspaceImpersonationPage() {
  const router = useRouter()
  const { accessToken } = useToken()
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <ImpersonationSection token={accessToken} goHome={() => router.push('/dashboard')} />
      </div>
    </div>
  )
}
