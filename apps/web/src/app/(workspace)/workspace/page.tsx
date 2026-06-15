'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building } from 'lucide-react'
import { useToken } from '@/context/useTokenContext'
import { getMyAdminWorkspaces } from '@shared-core/fetchApi/api.fetch'
import Spinner from '@/component/Spinner'

// Entering Workspace settings auto-opens the first workspace the user manages.
// From there the sidebar dropdown lets them switch between the others.
export default function WorkspaceIndexPage() {
  const router = useRouter()
  const { accessToken } = useToken()
  const [empty, setEmpty] = useState(false)

  useEffect(() => {
    if (!accessToken) return
    let cancelled = false
    getMyAdminWorkspaces(accessToken).then(res => {
      if (cancelled) return
      const list = Array.isArray(res?.data) ? res.data : []
      if (list.length > 0) {
        router.replace(`/workspace/${list[0].uid}/general`)
      } else {
        setEmpty(true)
      }
    })
    return () => { cancelled = true }
  }, [accessToken, router])

  if (empty) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
          <Building className="h-6 w-6 text-green-700" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">No workspaces to manage</h2>
        <p className="text-sm text-gray-500 max-w-md">
          You are not an owner or admin of any workspace yet.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex items-center justify-center">
      <Spinner />
    </div>
  )
}
