'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useParams } from 'next/navigation'
import {
  Activity, ArrowLeft, Check, CheckSquare, ChevronDown, FolderOpen, Settings, Users,
} from 'lucide-react'
import { useToken } from '@/context/useTokenContext'
import { useUserStore } from '@shared-core/store/useUserStore'
import useProjectStore from '@shared-core/store/useProjectStore'
import { getMyAdminWorkspaces, setPrimaryWorkspace } from '@shared-core/fetchApi/api.fetch'
import { Avatar } from '@/app/dashboard/workspace/components/workspace-ui'

const SECTIONS = [
  { id: 'general', label: 'General Settings', icon: Settings },
  { id: 'members', label: 'Member Management', icon: Users },
  { id: 'projects', label: 'Project Management', icon: FolderOpen },
  { id: 'approvals', label: 'Approvals', icon: CheckSquare },
  { id: 'activity', label: 'Activity & Audit', icon: Activity },
]

export default function WorkspaceSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { workspaceUid } = useParams<{ workspaceUid: string }>()
  const { accessToken } = useToken()
  const currentUser = useUserStore(state => state.user)
  const selectedWorkspace = useProjectStore(state => state.selectedWorkspce)
  const selectedProject = useProjectStore(state => state.selectedProject)
  const [adminWorkspaces, setAdminWorkspaces] = useState<{ uid: string; name: string; slug: string; role: string }[]>([])
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getMyAdminWorkspaces(accessToken).then(res => {
      if (Array.isArray(res?.data)) setAdminWorkspaces(res.data)
    })
  }, [accessToken])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setWsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // On the /workspace index there is no route param; fall back to the
  // currently selected workspace so the switcher and section links still work.
  const wsUid = workspaceUid ?? selectedWorkspace?.uid
  const activeSection = pathname.match(/^\/workspace\/[^/]+\/([^/]+)/)?.[1] ?? 'general'
  const canSwitch = adminWorkspaces.length > 1

  const backToDashboard = () => {
    router.push(selectedProject?.uid ? `/project/${selectedProject.uid}/overview` : '/')
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-full relative">
      <div className="p-6 border-b border-gray-200">
        <button
          type="button"
          onClick={backToDashboard}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Workspace Settings</h1>
        <div className="relative mt-1" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setWsDropdownOpen(o => !o)}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors w-full"
            disabled={!canSwitch}
          >
            <span className="truncate">{selectedWorkspace?.name}</span>
            {canSwitch && (
              <ChevronDown className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${wsDropdownOpen ? 'rotate-180' : ''}`} />
            )}
          </button>
          {wsDropdownOpen && canSwitch && (
            <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
              {adminWorkspaces.map(ws => {
                const isCurrent = ws.uid === selectedWorkspace?.uid
                return (
                  <button
                    key={ws.uid}
                    type="button"
                    onClick={() => {
                      setWsDropdownOpen(false)
                      if (!isCurrent) {
                        // Persist the choice as the admin's primary workspace so
                        // the rest of the app follows them to the new workspace.
                        setPrimaryWorkspace(accessToken, { workspaceUid: ws.uid }).catch(() => {})
                        router.push(`/workspace/${ws.uid}/${activeSection}`)
                      }
                    }}
                    className={`w-full flex items-center gap-2 text-left px-3 py-2 text-sm truncate ${
                      isCurrent ? 'text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="flex-1 truncate">{ws.name}</span>
                    {isCurrent && <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-700" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {SECTIONS.map(section => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/workspace/${wsUid}/${section.id}`)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive ? 'bg-[#007A49] text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {currentUser && (
        <div className="p-4 border-t border-gray-200 bg-white mt-auto">
          <div className="flex items-center gap-3">
            <Avatar
              src={currentUser.image}
              alt={(currentUser as any).displayName || currentUser.name || ''}
              fallback={((currentUser as any).displayName || currentUser.name || '').split(' ').map((n: string) => n[0]).join('')}
              className="h-8 w-8"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900 truncate">{(currentUser as any).displayName || currentUser.name}</div>
              <div className="text-xs text-gray-500">Workspace Admin</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
