'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'react-toastify'
import { useToken } from '@/context/useTokenContext'
import { startImpersonationWork } from '@shared-core/fetchApi/api.fetch'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ImpersonateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { accessToken } = useToken()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    const value = email.trim()
    if (!EMAIL_RE.test(value)) {
      setError('Enter a valid email address')
      return
    }
    setError('')
    try {
      setLoading(true)
      const resp = await startImpersonationWork(accessToken || '', value)
      if (resp.statusCode === 200 || resp.statusCode === 201) {
        window.location.replace('/dashboard')
        return
      }
      setLoading(false)
      toast.error(resp?.message ? String(resp.message) : 'Could not impersonate that user')
    } catch {
      setLoading(false)
      toast.error('Could not impersonate that user')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Impersonate user</DialogTitle>
          <DialogDescription>
            Enter the email of the user to impersonate. This action is logged for audit.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="impersonate-email">Email</Label>
          <Input
            id="impersonate-email"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (error) setError('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Starting...' : 'Impersonate'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
