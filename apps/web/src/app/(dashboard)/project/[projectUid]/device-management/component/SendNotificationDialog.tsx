'use client'

import React, { useEffect, useState } from 'react'
import { Send, Bell, Smartphone, Users, Zap, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { notifyProjectDevices } from '@shared-core/fetchApi/api.fetch'
import { useToken } from '@/context/useTokenContext'
import useProjectStore from '@shared-core/store/useProjectStore'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { errorMessage } from './helpers'
import type { NotifyResult, Priority } from './types'

// Kept a little under the point where Android and iOS start truncating.
const TITLE_MAX = 65
const MESSAGE_MAX = 240

// Matches the server's SendDeviceNotificationDto.
type Recipients = 'fleet' | 'selected'

export interface ComposePrefill {
  target?: Recipients
  // Required when target is 'selected'.
  deviceUids?: string[]
  // What to call this audience in the UI, e.g. a person's name.
  targetLabel?: string
  title?: string
  message?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefill: ComposePrefill
  fleetCount: number
  onSent: () => void
}

const SendNotificationDialog = ({ open, onOpenChange, prefill, fleetCount, onSent }: Props) => {
  const [recipients, setRecipients] = useState<Recipients>('fleet')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<Priority>('normal')
  const [sending, setSending] = useState(false)

  const selectedProject = useProjectStore(state => state.selectedProject)
  const { accessToken } = useToken()

  const prefillUids = prefill.deviceUids ?? []
  const hasSelection = prefillUids.length > 0

  // Reset to reflect the entry point: the fleet button, a single device, or the
  // "nudge outdated devices" link.
  useEffect(() => {
    if (open) {
      setRecipients(prefill.target ?? (hasSelection ? 'selected' : 'fleet'))
      setTitle((prefill.title ?? '').slice(0, TITLE_MAX))
      setMessage((prefill.message ?? '').slice(0, MESSAGE_MAX))
      setPriority('normal')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefill])

  const recipientCount = recipients === 'fleet' ? fleetCount : prefillUids.length
  const targetLabel = recipients === 'fleet'
    ? 'Whole fleet'
    : prefill.targetLabel ?? `${prefillUids.length} device${prefillUids.length !== 1 ? 's' : ''}`

  const canSend = title.trim().length > 0 && message.trim().length > 0
    && !sending && recipientCount > 0

  const handleSend = async () => {
    if (!selectedProject?.uid) {
      toast.error('No project selected')
      return
    }

    setSending(true)
    try {
      const response = await notifyProjectDevices(accessToken || '', selectedProject.uid, {
        title: title.trim(),
        message: message.trim(),
        priority,
        recipients,
        ...(recipients === 'selected' ? { deviceUids: prefillUids } : {}),
      })

      const result: NotifyResult | undefined = response?.data
      const statusCode = response?.statusCode ?? 200

      // The server answers with its own statusCode in the body, so a failure
      // does not throw. Read that rather than assuming success.
      if (statusCode >= 400) {
        toast.error(response?.message || 'Could not send the notification')
        // A push failure still recorded the message in-app, so refresh either way.
        if (result) onSent()
        return
      }

      if (result && result.pushConfigured === false) {
        toast.warning(
          `Saved in the app for ${result.usersNotified} recipient(s). Push delivery is not set up on this server.`,
        )
      } else if (result) {
        const skipped = result.devicesWithoutPushId
        toast.success(
          `Sent to ${result.pushAccepted} device(s)${skipped > 0 ? `, ${skipped} in-app only` : ''}`,
        )
      } else {
        toast.success(response?.message || 'Notification sent')
      }

      onSent()
      onOpenChange(false)
    } catch (err) {
      toast.error(errorMessage(err, 'Could not send the notification'))
    } finally {
      setSending(false)
    }
  }

  const RecipientButton = ({
    value, icon: Icon, label, sub, disabled,
  }: {
    value: Recipients; icon: React.ElementType; label: string; sub: string; disabled?: boolean
  }) => (
    <button
      type="button"
      onClick={() => !disabled && setRecipients(value)}
      disabled={disabled}
      className={cn(
        'flex-1 flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors',
        disabled && 'opacity-40 cursor-not-allowed',
        recipients === value
          ? 'border-[#007A49] bg-[#e6f1ec] dark:bg-green-900/20'
          : 'border-border hover:bg-muted/50',
      )}
    >
      <Icon size={16} className="text-[#007A49] flex-shrink-0" />
      <span className="min-w-0">
        <span className="block text-sm font-medium truncate">{label}</span>
        <span className="block text-[11px] text-gray-500 truncate">{sub}</span>
      </span>
    </button>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="bg-green-50 p-1.5 rounded-lg">
              <Bell size={16} className="text-[#007A49]" />
            </span>
            Send push notification
          </DialogTitle>
          <DialogDescription>
            Goes to the TreeMapper mobile app and to each recipient&apos;s in-app
            notification list. Arrival depends on the device being reachable.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipients */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Recipients</Label>
            <div className="flex gap-2">
              <RecipientButton value="fleet" icon={Users} label="Whole fleet"
                sub={`${fleetCount} reachable`} />
              <RecipientButton value="selected" icon={Smartphone}
                label={hasSelection ? targetLabel : 'Selected devices'}
                sub={hasSelection
                  ? `${prefillUids.length} device${prefillUids.length !== 1 ? 's' : ''}`
                  : 'None selected'}
                disabled={!hasSelection} />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-title" className="text-xs text-gray-500">Title</Label>
              <span className="text-[11px] text-gray-400">{title.length}/{TITLE_MAX}</span>
            </div>
            <Input
              id="notif-title" value={title} maxLength={TITLE_MAX}
              placeholder="Please sync when on Wi-Fi"
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-message" className="text-xs text-gray-500">Message</Label>
              <span className="text-[11px] text-gray-400">{message.length}/{MESSAGE_MAX}</span>
            </div>
            <Textarea
              id="notif-message" value={message} maxLength={MESSAGE_MAX} rows={3}
              placeholder="Your device has interventions queued. Please open the app on Wi-Fi to upload them."
              onChange={e => setMessage(e.target.value)}
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Priority</Label>
            <div className="flex gap-2 max-w-[220px]">
              {(['normal', 'high'] as const).map(p => (
                <button
                  key={p} type="button" onClick={() => setPriority(p)}
                  className={cn(
                    'flex-1 inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs capitalize transition-colors',
                    priority === p
                      ? 'border-[#007A49] bg-[#e6f1ec] dark:bg-green-900/20 font-medium'
                      : 'border-border hover:bg-muted/50',
                  )}
                >
                  {p === 'high' && <Zap size={12} />}{p}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {(title || message) && (
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Preview</Label>
              <div className="rounded-xl bg-gray-900 text-white px-3 py-2.5 flex items-start gap-2.5">
                <span className="bg-[#007A49] rounded-md p-1.5 flex-shrink-0">
                  <Bell size={14} className="text-white" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">TreeMapper</p>
                  <p className="text-sm font-semibold truncate">{title || 'Title'}</p>
                  <p className="text-xs text-gray-300 line-clamp-2">{message || 'Message'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!canSend} className="bg-[#007A49] hover:bg-green-700 text-white">
            {sending
              ? <Loader2 size={15} className="mr-1.5 animate-spin" />
              : <Send size={15} className="mr-1.5" />}
            {sending
              ? 'Sending...'
              : `Send to ${recipientCount} ${recipientCount === 1 ? 'device' : 'devices'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SendNotificationDialog
