'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building, ChevronRight } from 'lucide-react'
import { useToken } from '@/context/useTokenContext'
import { getMyAdminWorkspaces } from '@shared-core/fetchApi/api.fetch'

export default function WorkspaceIndexPage() {
  const router = useRouter()
  const { accessToken } = useToken()
  const [workspaces, setWorkspaces] = useState<{ uid: string; name: string; role: string }[]>([])

  useEffect(() => {
    getMyAdminWorkspaces(accessToken).then(res => {
      if (Array.isArray(res?.data)) setWorkspaces(res.data)
    })
  }, [accessToken])

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Workspaces</h1>
        <p className="text-gray-500 mb-6">Select a workspace to manage its settings, members, and projects.</p>
        <ul className="space-y-2">
          {workspaces.map(ws => (
            <li key={ws.uid}>
              <button
                type="button"
                onClick={() => router.push(`/workspace/${ws.uid}/general`)}
                className="w-full flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 flex-shrink-0">
                  <Building className="h-5 w-5 text-green-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 truncate">{ws.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{ws.role}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
