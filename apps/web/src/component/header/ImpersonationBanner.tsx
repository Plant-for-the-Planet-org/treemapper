'use client'

import { useState } from 'react'
import { UserCheck, LogOut } from 'lucide-react'
import { toast } from 'react-toastify'
import { useUserStore } from '@shared-core/store/useUserStore'
import { useToken } from '@/context/useTokenContext'
import { exitImpersonationWork } from '@shared-core/fetchApi/api.fetch'

export default function ImpersonationBanner() {
  const user = useUserStore(state => state.user)
  const { accessToken } = useToken()
  const [exiting, setExiting] = useState(false)

  if (!user?.impersonated) return null

  const u = user as { email?: string }
  const label = u.email || 'user'

  const handleExit = async () => {
    try {
      setExiting(true)
      const resp = await exitImpersonationWork(accessToken || '')
      if (resp.statusCode !== 200 && resp.statusCode !== 201) throw new Error('exit failed')
      // Re-bootstrap as the real user; /dashboard resolves their primary project.
      setTimeout(() => { window.location.href = '/' }, 600)
    } catch {
      setExiting(false)
      toast.error('Could not exit impersonation. Please try again.')
    }
  }

  return (
    <div className="flex h-9 flex-shrink-0 items-center justify-between gap-2 bg-orange-500 px-3 text-white">
      <div className="flex min-w-0 items-center gap-2 text-xs font-medium">
        <UserCheck size={14} className="flex-shrink-0" />
        <span className="truncate">Impersonating {label}</span>
      </div>
      <button
        onClick={handleExit}
        disabled={exiting}
        className="flex items-center gap-1.5 rounded-md bg-white/15 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-white/25 disabled:opacity-60"
      >
        <LogOut size={13} />
        {exiting ? 'Exiting...' : 'Exit'}
      </button>
    </div>
  )
}
