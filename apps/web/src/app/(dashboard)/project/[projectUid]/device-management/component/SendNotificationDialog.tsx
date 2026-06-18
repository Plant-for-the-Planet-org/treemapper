'use client'

import React, { useEffect, useState } from 'react'
import { Send, Bell, Smartphone, Users } from 'lucide-react'
import { toast } from 'react-toastify'
import { notifyProjectDevices } from '@shared-core/fetchApi/api.fetch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Device } from './DeviceManagement'

export type NotifyTarget = 'fleet' | 'selected'

const TITLE_MAX = 65
const MESSAGE_MAX = 240

const QUICK_TEMPLATES = [
  {
    label: 'Sync your data',
    title: 'Please sync when on Wi-Fi',
    message: 'Please open the app on Wi-Fi to upload your latest interventions. Thanks!',
  },
  {
    label: 'New monitoring',
    title: 'New monitoring form available',
    message: 'A new monitoring form is ready. Please check the app to start your visit.',
  },
  {
    label: 'Update app',
    title: 'Update to the latest version',
    message: 'A new app version is available with bug fixes. Please update when you can.',
  },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectUid: string
  token: string
  target: NotifyTarget
  device: Device | null
  fleetCount: number
}

const SendNotificationDialog = ({
  open, onOpenChange, projectUid, token, target, device, fleetCount,
}: Props) => {
  const [recipients, setRecipients] = useState<NotifyTarget>(target)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'normal' | 'high'>('normal')
  const [sending, setSending] = useState(false)

  // Reset the form each time the dialog opens so it reflects the entry point
  // (fleet button vs. a single device).
  useEffect(() => {
    if (open) {
      setRecipients(target)
      setTitle('')
      setMessage('')
      setPriority('normal')
    }
  }, [open, target])

  const applyTemplate = (t: typeof QUICK_TEMPLATES[number]) => {
    setTitle(t.title.slice(0, TITLE_MAX))
    setMessage(t.message.slice(0, MESSAGE_MAX))
  }

  const canSend = title.trim().length > 0 && message.trim().length > 0 && !sending
    && (recipients === 'fleet' ? fleetCount > 0 : !!device)

  const recipientCount = recipients === 'fleet' ? fleetCount : 1

  const handleSend = async () => {
    if (!projectUid) {
      toast.error('No project selected')
      return
    }
    setSending(true)
    try {
      const payload: Record<string, any> = {
        title: title.trim(),
        message: message.trim(),
        priority,
        recipients,
      }
      if (recipients === 'selected' && device) {
        payload.deviceUids = [device.uid]
      }
      const res = await notifyProjectDevices(token, projectUid, payload)
      if (res?.statusCode === 200 || res?.statusCode === 201) {
        const count = res?.data?.recipients ?? recipientCount
        toast.success(`Notification sent to ${count} recipient(s)`)
        onOpenChange(false)
      } else {
        toast.error(res?.message || 'Could not send notification')
      }
    } catch {
      toast.error('Could not send notification')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="bg-green-50 p-1.5 rounded-lg">
              <Bell size={16} className="text-[#007A49]" />
            </span>
            Send push notification
          </DialogTitle>
          <DialogDescription>
            Delivered to the TreeMapper mobile app. Real-time push depends on the user&apos;s device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipients */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Recipients</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => device && setRecipients('selected')}
                disabled={!device}
                className={cn(
                  'flex-1 flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors',
                  !device && 'opacity-40 cursor-not-allowed',
                  recipients === 'selected'
                    ? 'border-[#007A49] bg-[#e6f1ec] dark:bg-green-900/20'
                    : 'border-border hover:bg-muted/50',
                )}
              >
                <Smartphone size={16} className="text-[#007A49]" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium truncate">
                    {device ? device.user.name : 'Single device'}
                  </span>
                  <span className="block text-[11px] text-gray-500">This device</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRecipients('fleet')}
                className={cn(
                  'flex-1 flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors',
                  recipients === 'fleet'
                    ? 'border-[#007A49] bg-[#e6f1ec] dark:bg-green-900/20'
                    : 'border-border hover:bg-muted/50',
                )}
              >
                <Users size={16} className="text-[#007A49]" />
                <span>
                  <span className="block text-sm font-medium">Whole fleet</span>
                  <span className="block text-[11px] text-gray-500">{fleetCount} reachable</span>
                </span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-title" className="text-xs text-gray-500">Title</Label>
              <span className="text-[11px] text-gray-400">{title.length}/{TITLE_MAX}</span>
            </div>
            <Input
              id="notif-title"
              value={title}
              maxLength={TITLE_MAX}
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
              id="notif-message"
              value={message}
              maxLength={MESSAGE_MAX}
              rows={3}
              placeholder="Your device has interventions queued. Please open the app on Wi-Fi to upload them."
              onChange={e => setMessage(e.target.value)}
            />
          </div>

          {/* Quick templates */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Quick templates</Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_TEMPLATES.map(t => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="text-xs rounded-full border border-border px-3 py-1 hover:bg-muted/50 transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Priority</Label>
            <div className="flex gap-2">
              {(['normal', 'high'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors',
                    priority === p
                      ? 'border-[#007A49] bg-[#e6f1ec] dark:bg-green-900/20 font-medium'
                      : 'border-border hover:bg-muted/50',
                  )}
                >
                  {p === 'high' ? 'High — wakes the device' : 'Normal'}
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
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="bg-[#007A49] hover:bg-green-700 text-white"
          >
            <Send size={15} className="mr-1.5" />
            {sending ? 'Sending...' : `Send to ${recipientCount} ${recipientCount === 1 ? 'device' : 'devices'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SendNotificationDialog
