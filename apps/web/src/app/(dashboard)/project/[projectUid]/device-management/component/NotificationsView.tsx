'use client'

import React, { useMemo, useState } from 'react'
import {
  Send, Users, Smartphone, Filter, CheckCircle2, Clock, XCircle, Loader2,
  Eye, MailCheck, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { NotificationCampaign, CampaignStatus } from './mockData'
import { relativeTime, timeUntil, deliveryRate, openRate } from './helpers'

const STATUS_META: Record<CampaignStatus, { label: string; icon: React.ElementType; cls: string }> = {
  sent: { label: 'Sent', icon: CheckCircle2, cls: 'text-green-700 bg-green-50 border-green-200' },
  scheduled: { label: 'Scheduled', icon: Clock, cls: 'text-blue-700 bg-blue-50 border-blue-200' },
  sending: { label: 'Sending', icon: Loader2, cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  failed: { label: 'Failed', icon: XCircle, cls: 'text-red-700 bg-red-50 border-red-200' },
}

const TargetIcon = ({ target }: { target: NotificationCampaign['target'] }) => {
  if (target === 'fleet') return <Users size={13} className="text-gray-400" />
  if (target === 'device') return <Smartphone size={13} className="text-gray-400" />
  return <Filter size={13} className="text-gray-400" />
}

const Stat = ({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string
}) => (
  <div className="flex items-center gap-2">
    <Icon size={14} className="text-gray-400" />
    <div className="leading-tight">
      <p className="text-sm font-semibold text-gray-900 tabular-nums">
        {value}{sub && <span className="text-xs font-normal text-gray-400 ml-1">{sub}</span>}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
    </div>
  </div>
)

const CampaignRow = ({ c }: { c: NotificationCampaign }) => {
  const [open, setOpen] = useState(false)
  const meta = STATUS_META[c.status]
  const StatusIcon = meta.icon
  const isSent = c.status === 'sent'

  return (
    <div className="rounded-xl border border-border bg-card hover:border-gray-300 transition-colors">
      <button onClick={() => setOpen(o => !o)} className="w-full text-left p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className={cn('gap-1 text-[10px]', meta.cls)}>
              <StatusIcon size={11} className={c.status === 'sending' ? 'animate-spin' : ''} />
              {meta.label}
            </Badge>
            {c.priority === 'high' && (
              <Badge variant="outline" className="text-[10px] text-orange-700 bg-orange-50 border-orange-200">
                High priority
              </Badge>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
              <TargetIcon target={c.target} />
              {c.targetLabel}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate">{c.title}</p>
          <p className="text-xs text-gray-500 line-clamp-1">{c.message}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[11px] text-gray-400 whitespace-nowrap">
            {c.status === 'scheduled' ? timeUntil(c.scheduledFor) : relativeTime(c.createdAt)}
          </span>
          {isSent && (
            <span className="text-[11px] text-gray-500 tabular-nums">
              {deliveryRate(c.delivered, c.recipients)}% delivered
            </span>
          )}
          <ChevronRight size={14} className={cn('text-gray-300 transition-transform', open && 'rotate-90')} />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
          <p className="text-sm text-gray-700 bg-muted/50 rounded-lg p-3">{c.message}</p>
          {isSent ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat icon={Users} label="Recipients" value={c.recipients} />
                <Stat icon={MailCheck} label="Delivered" value={c.delivered}
                  sub={`${deliveryRate(c.delivered, c.recipients)}%`} />
                <Stat icon={Eye} label="Opened" value={c.opened}
                  sub={`${openRate(c.opened, c.delivered)}%`} />
                <Stat icon={XCircle} label="Failed" value={c.failed} />
              </div>
              {/* delivery / open progress */}
              <div className="space-y-1">
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                  <div className="h-full bg-green-500" style={{ width: `${(c.opened / c.recipients) * 100}%` }} />
                  <div className="h-full bg-green-200" style={{ width: `${((c.delivered - c.opened) / c.recipients) * 100}%` }} />
                  <div className="h-full bg-red-300" style={{ width: `${(c.failed / c.recipients) * 100}%` }} />
                </div>
                <div className="flex gap-4 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" />Opened</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-200" />Delivered</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-300" />Failed</span>
                </div>
              </div>
            </>
          ) : c.status === 'scheduled' ? (
            <p className="text-xs text-blue-700 flex items-center gap-1.5">
              <Clock size={13} /> Scheduled to send {timeUntil(c.scheduledFor)} to {c.recipients} devices.
            </p>
          ) : (
            <p className="text-xs text-red-700 flex items-center gap-1.5">
              <XCircle size={13} /> Delivery failed. The device may be offline or have notifications disabled.
            </p>
          )}
          <p className="text-[11px] text-gray-400">Sent by {c.sentBy}</p>
        </div>
      )}
    </div>
  )
}

interface Props {
  campaigns: NotificationCampaign[]
  onCompose: () => void
}

const NotificationsView = ({ campaigns, onCompose }: Props) => {
  const [statusFilter, setStatusFilter] = useState<'all' | CampaignStatus>('all')

  const filtered = useMemo(
    () => campaigns.filter(c => statusFilter === 'all' || c.status === statusFilter),
    [campaigns, statusFilter],
  )

  const totals = useMemo(() => {
    const sent = campaigns.filter(c => c.status === 'sent')
    const recipients = sent.reduce((a, c) => a + c.recipients, 0)
    const delivered = sent.reduce((a, c) => a + c.delivered, 0)
    const opened = sent.reduce((a, c) => a + c.opened, 0)
    return {
      campaigns: campaigns.length,
      avgDelivery: deliveryRate(delivered, recipients),
      avgOpen: openRate(opened, delivered),
      scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    }
  }, [campaigns])

  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
      {/* summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Campaigns sent" value={totals.campaigns} />
        <SummaryCard label="Avg delivery rate" value={`${totals.avgDelivery}%`} accent />
        <SummaryCard label="Avg open rate" value={`${totals.avgOpen}%`} accent />
        <SummaryCard label="Scheduled" value={totals.scheduled} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="h-9 w-[160px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All campaigns</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={onCompose} className="bg-[#007A49] hover:bg-green-700 text-white">
          <Send size={14} className="mr-1.5" /> New notification
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <Send size={28} className="text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No campaigns to show</p>
        </div>
      ) : (
        <div className="space-y-2.5 pb-2">
          {filtered.map(c => <CampaignRow key={c.uid} c={c} />)}
        </div>
      )}
    </div>
  )
}

const SummaryCard = ({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) => (
  <div className="rounded-xl border border-border bg-card px-4 py-3">
    <p className={cn('text-2xl font-bold tracking-tight', accent ? 'text-[#007A49]' : 'text-gray-900')}>{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
  </div>
)

export default NotificationsView
