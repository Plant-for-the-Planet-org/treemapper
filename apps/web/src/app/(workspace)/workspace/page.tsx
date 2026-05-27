'use client'

import { useRouter } from 'next/navigation'
import { Building, ChevronRight } from 'lucide-react'
import useProjectStore from '@shared-core/store/useProjectStore'

export default function WorkspaceIndexPage() {
  const router = useRouter()
  const workspaces = useProjectStore(state => state.workspace)

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
                  <div className="text-xs text-gray-500 capitalize">{ws.userRole}</div>
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
