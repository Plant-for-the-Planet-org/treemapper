'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useToken } from '@/context/useTokenContext'
import useProjectStore from '@shared-core/store/useProjectStore'
import { getWorkspace } from '@shared-core/fetchApi/api.fetch'
import Spinner from '@/component/Spinner'

export default function WorkspaceByIdLayout({ children }: { children: React.ReactNode }) {
  const { workspaceUid } = useParams<{ workspaceUid: string }>()
  const { accessToken } = useToken()
  const { selectedWorkspce, workspace, setDefaultWorkspce } = useProjectStore(state => state)
  const [ready, setReady] = useState(selectedWorkspce?.uid === workspaceUid)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!workspaceUid || selectedWorkspce?.uid === workspaceUid) {
      setReady(true)
      return
    }

    // Prefer the workspace already in the user's list (has role + type).
    const fromList = workspace.find(w => w.uid === workspaceUid)
    if (fromList) {
      setDefaultWorkspce(fromList)
      setReady(true)
      return
    }

    // Otherwise load it directly (e.g. an admin opening a workspace outside their list).
    if (!accessToken) return
    let cancelled = false
    getWorkspace(accessToken, workspaceUid).then(res => {
      if (cancelled) return
      // getWorkspace returns the raw workspace row (no { statusCode, data } envelope).
      if (res?.uid) {
        setDefaultWorkspce({ uid: res.uid, name: res.name ?? '', type: res.type ?? '', userRole: 'owner' } as any)
        setReady(true)
      } else {
        setNotFound(true)
      }
    })
    return () => { cancelled = true }
  }, [workspaceUid, accessToken, selectedWorkspce?.uid, workspace, setDefaultWorkspce])

  if (notFound) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2 p-8 text-center">
        <h2 className="text-lg font-semibold">Workspace not found</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          This workspace does not exist or you do not have access to it.
        </p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return <>{children}</>
}
