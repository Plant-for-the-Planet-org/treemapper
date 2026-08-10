'use client'

import React, { useEffect, useState } from 'react'
import { Send, Bell, Smartphone, Users, Filter, Clock, Zap } from 'lucide-react'
import { toast } from 'react-toastify'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type {
  Device, NotificationCampaign, CampaignTarget, Priority,
} from './mockData'
import { MOCK_TEMPLATES } from './mockData'

const TITLE_MAX = 65
const MESSAGE_MAX = 240

export interface ComposePrefill {
  target?: CampaignTarget
  device?: Device | null
  title?: string
  message?: string
}

// Mock segments — in production these would be saved, query-backed audiences.
const SEGMENTS = [
  { id: 'outdated', label: 'Outdated app versions', count: 3 },
  { id: 'pending', label: 'Has pending sync', count: 8 },
  { id: 'kijabe', label: 'Kijabe Ridge team', count: 4 },
  { id: 'storage', label: 'Storage over 85%', count: 3 },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefill: ComposePrefill
  fleetCount: number
  onSent: (campaign: NotificationCampaign) => void
}

const SendNotificationDialog = ({ open, onOpenChange, prefill, fleetCount, onSent }: Props) => {
  const [recipients, setRecipients] = useState<CampaignTarget>('fleet')
  const [segmentId, setSegmentId] = useState(SEGMENTS[0].id)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<Priority>('normal')
  const [schedule, setSchedule] = useState<'now' | 'later'>('now')
  const [scheduleAt, setScheduleAt] = useState('')
  const [sending, setSending] = useState(false)

  const device = prefill.device ?? null

  // Reset to reflect the entry point (fleet button, single device, or template).
  useEffect(() => {
    if (open) {
      setRecipients(prefill.target ?? (device ? 'device' : 'fleet'))
      setTitle((prefill.title ?? '').slice(0, TITLE_MAX))
      setMessage((prefill.message ?? '').slice(0, MESSAGE_MAX))
      setPriority('normal')
      setSchedule('now')
      setScheduleAt('')
    }
  }, [open, prefill, device])

  const segment = SEGMENTS.find(s => s.id === segmentId) ?? SEGMENTS[0]

  const recipientCount =
    recipients === 'fleet' ? fleetCount
      : recipients === 'segment' ? segment.count
        : device ? 1 : 0

  const targetLabel =
    recipients === 'fleet' ? 'Whole fleet'
      : recipients === 'segment' ? segment.label
        : device?.user.name ?? 'Device'

  const canSend = title.trim().length > 0 && message.trim().length > 0 && !sending
    && recipientCount > 0 && (schedule === 'now' || scheduleAt.length > 0)

  const applyTemplate = (id: string) => {
    const t = MOCK_TEMPLATES.find(x => x.uid === id)
    if (!t) return
    setTitle(t.title.slice(0, TITLE_MAX))
    setMessage(t.message.slice(0, MESSAGE_MAX))
  }

  const handleSend = async () => {
    setSending(true)
    // Simulate a push request. The mobile app POC only receives notifications,
    // so we fabricate a plausible delivery result here.
    await new Promise(r => setTimeout(r, 700))

    const scheduled = schedule === 'later'
    const delivered = scheduled ? 0 : Math.max(0, recipientCount - Math.round(recipientCount * 0.08))
    const opened = scheduled ? 0 : Math.round(delivered * 0.55)

    const campaign: NotificationCampaign = {
      uid: `camp-${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      priority,
      target: recipients,
      targetLabel,
      status: scheduled ? 'scheduled' : 'sent',
      createdAt: new Date().toISOString(),
      scheduledFor: scheduled ? new Date(scheduleAt).toISOString() : null,
      recipients: recipientCount,
      delivered,
      opened,
      failed: scheduled ? 0 : recipientCount - delivered,
      sentBy: 'You',
    }

    onSent(campaign)
    setSending(false)
    onOpenChange(false)
    toast.success(scheduled
      ? `Notification scheduled for ${recipientCount} device(s)`
      : `Notification sent to ${recipientCount} device(s)`)
  }

  const RecipientButton = ({
    value, icon: Icon, label, sub, disabled,
  }: {
    value: CampaignTarget; icon: React.ElementType; label: string; sub: string; disabled?: boolean
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
            Delivered to the TreeMapper mobile app. Real-time push depends on the user&apos;s device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipients */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Recipients</Label>
            <div className="flex gap-2">
              <RecipientButton value="fleet" icon={Users} label="Whole fleet"
                sub={`${fleetCount} reachable`} />
              <RecipientButton value="segment" icon={Filter} label="Segment"
                sub="Target a group" />
              <RecipientButton value="device" icon={Smartphone}
                label={device ? device.user.name : 'Single device'}
                sub={device ? 'This device' : 'None selected'} disabled={!device} />
            </div>
            {recipients === 'segment' && (
              <Select value={segmentId} onValueChange={setSegmentId}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEGMENTS.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.label} ({s.count})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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

          {/* Templates */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Start from a template</Label>
            <div className="flex flex-wrap gap-2">
              {MOCK_TEMPLATES.slice(0, 5).map(t => (
                <button
                  key={t.uid} type="button" onClick={() => applyTemplate(t.uid)}
                  className="text-xs rounded-full border border-border px-3 py-1 hover:bg-muted/50 transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority + schedule */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Priority</Label>
              <div className="flex gap-2">
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
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Delivery</Label>
              <div className="flex gap-2">
                {(['now', 'later'] as const).map(s => (
                  <button
                    key={s} type="button" onClick={() => setSchedule(s)}
                    className={cn(
                      'flex-1 inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs capitalize transition-colors',
                      schedule === s
                        ? 'border-[#007A49] bg-[#e6f1ec] dark:bg-green-900/20 font-medium'
                        : 'border-border hover:bg-muted/50',
                    )}
                  >
                    {s === 'later' && <Clock size={12} />}{s === 'now' ? 'Send now' : 'Schedule'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {schedule === 'later' && (
            <Input
              type="datetime-local" value={scheduleAt}
              onChange={e => setScheduleAt(e.target.value)} className="h-9"
            />
          )}

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
            <Send size={15} className="mr-1.5" />
            {sending ? 'Sending...'
              : schedule === 'later' ? `Schedule for ${recipientCount}`
                : `Send to ${recipientCount} ${recipientCount === 1 ? 'device' : 'devices'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SendNotificationDialog
