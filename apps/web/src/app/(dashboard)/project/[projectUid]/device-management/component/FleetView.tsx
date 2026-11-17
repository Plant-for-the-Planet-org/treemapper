'use client'

import React, { useMemo, useState } from 'react'
import {
  Smartphone, Search, Send, ChevronLeft, Globe, Clock, Tag, Bell, CircleSlash,
  HardDrive, Wifi, WifiOff, Signal, RefreshCw, ArrowUpCircle, CheckCircle2,
  Power, PowerOff, Loader2, FileClock, Wrench, History, Trash2, AlertCircle,
  TriangleAlert,
} from 'lucide-react'
import { toast } from 'react-toastify'
import {
  updateProjectDeviceState, deleteProjectDevice,
} from '@shared-core/fetchApi/api.fetch'
import { useToken } from '@/context/useTokenContext'
import useProjectStore from '@shared-core/store/useProjectStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Device, SyncSnapshot, DeviceErrorLog } from './types'
import {
  platformLabel, initials, relativeTime, formatDate, dateWithAge, shortDateTime,
  networkLabel, levelColor, levelBar, roleLabel, errorMessage,
} from './helpers'

type PlatformFilter = 'all' | 'ios' | 'android'
type StatusFilter = 'all' | 'online' | 'pending' | 'fix' | 'drafts' | 'inactive'

const NetworkIcon = ({ type, size = 14 }: { type: string | null; size?: number }) => {
  if (type === 'wifi') return <Wifi size={size} className="text-green-600" />
  if (type === 'cellular') return <Signal size={size} className="text-green-600" />
  return <WifiOff size={size} className="text-gray-400" />
}

// Renders a 0-100 meter. Null means the device has not reported the value, which
// is shown as "-" rather than as an empty bar reading zero.
const Meter = ({
  label, icon: Icon, pct,
}: {
  label: string
  icon: React.ElementType
  pct: number | null
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-gray-500">
        <Icon size={13} className="text-gray-400" />
        {label}
      </span>
      {pct === null ? (
        <span className="text-gray-400">-</span>
      ) : (
        <span className={cn('font-semibold tabular-nums', levelColor(pct))}>{pct}%</span>
      )}
    </div>
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      {pct !== null && (
        <div
          className={cn('h-full rounded-full transition-all', levelBar(pct))}
          style={{ width: `${Math.max(pct, 3)}%` }}
        />
      )}
    </div>
  </div>
)

interface Props {
  devices: Device[]
  selectedUid: string | null
  latestAppVersion: string | null
  onSelect: (uid: string) => void
  onNotify: (device: Device) => void
  onDeviceChanged: () => void
}

const FleetView = ({
  devices, selectedUid, latestAppVersion, onSelect, onNotify, onDeviceChanged,
}: Props) => {
  const [search, setSearch] = useState('')
  const [platform, setPlatform] = useState<PlatformFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return devices.filter(d => {
      if (platform !== 'all' && d.deviceOs !== platform) return false
      if (status === 'online' && !d.online) return false
      if (status === 'pending' && !(d.pendingInterventions ?? 0)) return false
      if (status === 'fix' && !(d.syncSnapshot?.fixRequired ?? 0)) return false
      if (status === 'drafts' && !(d.syncSnapshot?.drafts ?? 0)) return false
      if (status === 'inactive' && d.isActive) return false
      if (!term) return true
      return [d.user.name, d.user.email, d.deviceName, d.deviceModel, platformLabel(d.deviceOs)]
        .some(v => (v || '').toLowerCase().includes(term))
    })
  }, [devices, search, platform, status])

  const selectedDevice = useMemo(
    () => devices.find(d => d.uid === selectedUid) ?? null,
    [devices, selectedUid],
  )

  return (
    <div className="flex-1 flex min-h-0 border border-border rounded-xl overflow-hidden bg-card">
      {/* List */}
      <div className={cn(
        'w-full md:w-[380px] md:flex-shrink-0 border-r border-border flex flex-col min-h-0',
        mobileView === 'detail' && 'hidden md:flex',
      )}>
        <div className="p-3 border-b border-border space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search devices or people"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={platform} onValueChange={v => setPlatform(v as PlatformFilter)}>
              <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                <SelectItem value="ios">iOS</SelectItem>
                <SelectItem value="android">Android</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={v => setStatus(v as StatusFilter)}>
              <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="pending">Has pending sync</SelectItem>
                <SelectItem value="fix">Needs fixing</SelectItem>
                <SelectItem value="drafts">Has drafts</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
              <Smartphone size={28} className="text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">
                {devices.length === 0
                  ? 'No devices registered yet'
                  : 'No devices match your filters'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map(device => (
                <li key={device.uid}>
                  <button
                    onClick={() => { onSelect(device.uid); setMobileView('detail') }}
                    className={cn(
                      'w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors',
                      selectedUid === device.uid && 'bg-[#e6f1ec] dark:bg-green-900/20',
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={device.user.image || undefined} alt={device.user.name} />
                        <AvatarFallback className="text-[11px] bg-green-700 text-white">
                          {initials(device.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className={cn(
                        'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
                        device.online ? 'bg-green-500' : 'bg-gray-300',
                      )} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{device.user.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {device.deviceName || device.deviceModel || 'Unknown device'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {platformLabel(device.deviceOs)}
                        </Badge>
                        {(device.pendingInterventions ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                            <RefreshCw size={10} />
                            {device.pendingInterventions} queued
                          </span>
                        )}
                        {/* Shown beside "queued", never folded into it: these
                            two need the person holding the phone, not a sync. */}
                        {(device.syncSnapshot?.fixRequired ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-medium">
                            <Wrench size={10} />
                            {device.syncSnapshot?.fixRequired} to fix
                          </span>
                        )}
                        {(device.syncSnapshot?.drafts ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                            <FileClock size={10} />
                            {device.syncSnapshot?.drafts} draft{device.syncSnapshot?.drafts !== 1 && 's'}
                          </span>
                        )}
                        {device.needsUpdate && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                            <ArrowUpCircle size={10} />
                            update
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 self-start mt-1">
                      {relativeTime(device.lastActiveAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Detail */}
      <div className={cn(
        'flex-1 min-h-0 overflow-y-auto',
        mobileView === 'list' && 'hidden md:block',
      )}>
        {selectedDevice ? (
          <DeviceDetail
            device={selectedDevice}
            latestAppVersion={latestAppVersion}
            onBack={() => setMobileView('list')}
            onNotify={() => onNotify(selectedDevice)}
            onDeviceChanged={onDeviceChanged}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <Smartphone size={32} className="text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Select a device to see details</p>
          </div>
        )}
      </div>
    </div>
  )
}

// What this device is still holding, and why each part of it is stuck.
//
// Three groups, kept apart because the reader does something different about
// each: queued work uploads itself on the next connection, a draft needs the
// person to finish it, and a fix-required record needs the person to correct
// it. Rolling them into one number would turn "nudge this device" into advice
// that cannot work.
//
// Only non-zero rows are listed, so a busy device does not bury its one real
// problem under five zeros.
const SyncWork = ({
  snapshot, pendingInterventions, pendingTrees,
}: {
  snapshot: SyncSnapshot | null
  pendingInterventions: number | null
  pendingTrees: number
}) => {
  const rows = snapshot
    ? ([
      { key: 'drafts', label: 'Started, not finished', value: snapshot.drafts, cls: 'text-gray-700' },
      { key: 'fix', label: 'Needs fixing on the device', value: snapshot.fixRequired, cls: 'text-red-600' },
      { key: 'data', label: 'Queued: intervention upload', value: snapshot.queued.dataUpload, cls: 'text-amber-600' },
      { key: 'sample', label: 'Queued: sample trees', value: snapshot.queued.sampleTree, cls: 'text-amber-600' },
      { key: 'image', label: 'Queued: tree photos', value: snapshot.queued.treeImage, cls: 'text-amber-600' },
      { key: 'remeasure', label: 'Queued: remeasurements', value: snapshot.queued.remeasurement, cls: 'text-amber-600' },
      { key: 'other', label: 'Queued: other', value: snapshot.queued.other, cls: 'text-amber-600' },
    ].filter(r => r.value > 0))
    : []

  const total = snapshot
    ? snapshot.drafts + snapshot.fixRequired +
      Object.values(snapshot.queued).reduce((sum, n) => sum + n, 0)
    : 0

  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">Unsynced work</h3>
        {snapshot === null ? null : total > 0 ? (
          <span className="text-sm font-semibold text-gray-900 tabular-nums">
            {total} intervention{total !== 1 && 's'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
            <CheckCircle2 size={13} />
            Nothing waiting
          </span>
        )}
      </div>

      {/* A device that has never reported is not a device with nothing to
          report, so these two cases read differently. */}
      {snapshot === null ? (
        pendingInterventions === null ? (
          <p className="text-xs text-gray-400">
            This device has not reported its sync status yet.
          </p>
        ) : (
          <>
            {pendingInterventions > 0 ? (
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
                <RefreshCw size={13} />
                {pendingInterventions} intervention{pendingInterventions !== 1 && 's'} · {pendingTrees} tree{pendingTrees !== 1 && 's'} queued
              </p>
            ) : (
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                <CheckCircle2 size={13} />
                Fully synced
              </p>
            )}
            <p className="text-[11px] text-gray-400">
              Update the app on this device to see the full breakdown.
            </p>
          </>
        )
      ) : total === 0 ? null : (
        <>
          <ul className="space-y-1.5">
            {rows.map(r => (
              <li key={r.key} className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{r.label}</span>
                <span className={cn('font-semibold tabular-nums', r.cls)}>{r.value}</span>
              </li>
            ))}
            {pendingTrees > 0 && (
              <li className="flex items-center justify-between text-xs pt-1.5 border-t border-border">
                <span className="text-gray-500">Trees in the queued records</span>
                <span className="font-semibold tabular-nums text-amber-600">{pendingTrees}</span>
              </li>
            )}
          </ul>
          {snapshot.oldestPendingAt && (
            <p className="flex items-center gap-1.5 text-[11px] text-gray-400 pt-1 border-t border-border">
              <History size={12} />
              Oldest record {dateWithAge(snapshot.oldestPendingAt)}
            </p>
          )}
        </>
      )}
    </div>
  )
}

// The newest errors the device's own activity log recorded, which is the
// nearest thing to "why is this phone not working" without asking its holder
// to export the log and send it over.
//
// Capped at 20 by both the app and the server and replaced on every app open,
// so it is a current picture and not a searchable history. The empty state
// says which of the two kinds of nothing this is: an app build too old to
// report, or a device that reported and had none.
//
// Collapsed to five rows, because twenty of these push everything else in the
// pane off the screen.
const VISIBLE_ERRORS = 5

const RecentErrors = ({ errors }: { errors: DeviceErrorLog[] | null }) => {
  const [expanded, setExpanded] = useState(false)

  if (errors === null) {
    return (
      <div className="rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Recent errors</h3>
        <p className="text-xs text-gray-400">
          This app build does not report errors. They are still on the device,
          under Activity Logs.
        </p>
      </div>
    )
  }

  const shown = expanded ? errors : errors.slice(0, VISIBLE_ERRORS)

  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">Recent errors</h3>
        {errors.length > 0 ? (
          <span className="text-sm font-semibold text-red-600 tabular-nums">
            {errors.length}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
            <CheckCircle2 size={13} />
            None reported
          </span>
        )}
      </div>

      {errors.length > 0 && (
        <>
          <ul className="space-y-2.5">
            {shown.map((log, i) => (
              // Indexed key: the list is replaced wholesale on every fetch and
              // never reordered in place, and two identical errors a second
              // apart are legitimately indistinguishable.
              <li key={`${log.at}-${i}`} className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {log.type}
                  </Badge>
                  {log.status && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 text-red-600 border-red-200"
                    >
                      HTTP {log.status}
                    </Badge>
                  )}
                  <span className="text-[10px] text-gray-400 ml-auto">
                    {shortDateTime(log.at)}
                  </span>
                </div>
                <p className="text-xs text-gray-700 break-words">{log.message}</p>
              </li>
            ))}
          </ul>

          {errors.length > VISIBLE_ERRORS && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-xs text-[#007A49] font-medium hover:underline"
            >
              {expanded
                ? 'Show fewer'
                : `Show all ${errors.length}`}
            </button>
          )}

          <p className="flex items-start gap-1.5 text-[11px] text-gray-400 pt-1 border-t border-border">
            <TriangleAlert size={12} className="mt-0.5 flex-shrink-0" />
            The 20 newest errors from the last app open. Older ones stay on the
            device under Activity Logs.
          </p>
        </>
      )}
    </div>
  )
}

const DetailRow = ({
  icon: Icon, label, value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) => (
  <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
    <span className="flex items-center gap-2 text-xs text-gray-500">
      <Icon size={14} className="text-gray-400" />
      {label}
    </span>
    <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
  </div>
)

const DeviceDetail = ({
  device, latestAppVersion, onBack, onNotify, onDeviceChanged,
}: {
  device: Device
  latestAppVersion: string | null
  onBack: () => void
  onNotify: () => void
  onDeviceChanged: () => void
}) => {
  const [updating, setUpdating] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [removing, setRemoving] = useState(false)
  const selectedProject = useProjectStore(state => state.selectedProject)
  const { accessToken } = useToken()

  const reachable = device.notificationPermission && device.isActive
  const pendingInterventions = device.pendingInterventions
  const pendingTrees = device.pendingTrees ?? 0

  const toggleActive = async () => {
    if (!selectedProject?.uid) return
    const nextState = !device.isActive
    setUpdating(true)
    try {
      const response = await updateProjectDeviceState(
        accessToken || '',
        selectedProject.uid,
        device.uid,
        { isActive: nextState },
      )
      if (response?.statusCode && response.statusCode >= 400) {
        toast.error(response.message || 'Could not update the device')
        return
      }
      toast.success(nextState ? 'Device reactivated' : 'Device deactivated')
      onDeviceChanged()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update the device'))
    } finally {
      setUpdating(false)
    }
  }

  const removeDevice = async () => {
    if (!selectedProject?.uid) return
    setRemoving(true)
    try {
      const response = await deleteProjectDevice(
        accessToken || '',
        selectedProject.uid,
        device.uid,
      )
      if (response?.statusCode && response.statusCode >= 400) {
        toast.error(response.message || 'Could not remove the device')
        return
      }
      toast.success('Device removed')
      setConfirmRemove(false)
      onDeviceChanged()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not remove the device'))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="p-4 md:p-5 space-y-4">
      <button onClick={onBack} className="md:hidden flex items-center gap-1 text-sm text-gray-500">
        <ChevronLeft size={16} /> Back
      </button>

      {/* Identity */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={device.user.image || undefined} alt={device.user.name} />
              <AvatarFallback className="bg-green-700 text-white">{initials(device.user.name)}</AvatarFallback>
            </Avatar>
            <span className={cn(
              'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card',
              device.online ? 'bg-green-500' : 'bg-gray-300',
            )} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900 truncate">{device.user.name}</h2>
              <Badge variant="outline" className="text-[10px]">{roleLabel(device.user.role)}</Badge>
            </div>
            <p className="text-xs text-gray-500 truncate">{device.user.email}</p>
          </div>
        </div>
        <Badge variant={device.online ? 'default' : 'secondary'} className={device.online ? 'bg-green-600' : ''}>
          {device.online ? 'Online' : device.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Telemetry. The sync story moved to its own card below, so this one is
          only about the state of the hardware. */}
      <div className="grid grid-cols-1 gap-x-5 gap-y-3 rounded-xl border border-border p-4">
        <Meter label="Storage used" pct={device.storageUsedPct} icon={HardDrive} />
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <span className="flex items-center gap-2 text-xs text-gray-500">
            <NetworkIcon type={device.networkType} />
            {networkLabel(device.networkType)}
          </span>
          <span className="text-xs text-gray-400">
            Last sync {relativeTime(device.lastSyncAt)}
          </span>
        </div>
      </div>

      <SyncWork
        snapshot={device.syncSnapshot}
        pendingInterventions={pendingInterventions}
        pendingTrees={pendingTrees}
      />

      <RecentErrors errors={device.recentErrors} />

      {/* Specs */}
      <div className="rounded-xl border border-border px-4">
        <DetailRow icon={Smartphone} label="Device"
          value={device.deviceName || device.deviceModel || 'Unknown'} />
        <DetailRow icon={Tag} label="Model" value={device.deviceModel || '-'} />
        <DetailRow icon={CheckCircle2} label="Platform"
          value={`${platformLabel(device.deviceOs)}${device.osVersion ? ` ${device.osVersion}` : ''}`} />
        <DetailRow icon={Tag} label="App version" value={
          <span className="inline-flex items-center gap-1.5">
            {device.appVersion || '-'}
            {device.needsUpdate ? (
              <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200">
                {latestAppVersion ? `${latestAppVersion} available` : 'update available'}
              </Badge>
            ) : device.appVersion ? (
              <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">latest</Badge>
            ) : null}
          </span>
        } />
        <DetailRow icon={Globe} label="Locale" value={device.locale || '-'} />
        <DetailRow icon={Globe} label="Timezone" value={device.timezone || '-'} />
        <DetailRow
          icon={device.notificationPermission ? Bell : CircleSlash}
          label="Notifications"
          value={device.notificationPermission
            ? <span className="text-green-700">Enabled</span>
            : <span className="text-gray-400">Disabled</span>}
        />
        <DetailRow icon={Clock} label="Last active" value={relativeTime(device.lastActiveAt)} />
        <DetailRow icon={Clock} label="Registered" value={formatDate(device.createdAt)} />
      </div>

      <div className="space-y-2">
        <Button
          onClick={onNotify}
          disabled={!reachable}
          className="w-full bg-[#007A49] hover:bg-green-700 text-white"
        >
          <Send size={15} className="mr-1.5" />
          Send notification to this device
        </Button>
        {!reachable && (
          <p className="text-[11px] text-gray-400 text-center">
            This device cannot receive notifications right now.
          </p>
        )}

        <Button
          variant="outline"
          onClick={toggleActive}
          disabled={updating}
          className={cn('w-full', device.isActive && 'text-red-600 hover:text-red-700')}
        >
          {updating ? (
            <Loader2 size={15} className="mr-1.5 animate-spin" />
          ) : device.isActive ? (
            <PowerOff size={15} className="mr-1.5" />
          ) : (
            <Power size={15} className="mr-1.5" />
          )}
          {device.isActive ? 'Deactivate device' : 'Reactivate device'}
        </Button>
        {/* Says "opening", not "signing in on": the app re-registers on every
            foreground, not only at login, so that is when this is undone. */}
        <p className="text-[11px] text-gray-400 text-center">
          {device.isActive
            ? 'Stops this device receiving notifications until someone opens the app on it again.'
            : 'Lets this device receive notifications again.'}
        </p>

        <Button
          variant="ghost"
          onClick={() => setConfirmRemove(true)}
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 size={15} className="mr-1.5" />
          Remove device
        </Button>
      </div>

      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Remove device</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="flex items-center justify-center w-14 h-14 bg-destructive/10 rounded-full">
              <AlertCircle className="w-7 h-7 text-destructive" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Remove <strong className="text-foreground">
                {device.deviceName || device.deviceModel || 'this device'}
              </strong> from the fleet? It stops receiving notifications and
              drops out of every count on this page.
            </p>
            {/* The honest caveat. Removing is for the rows a reinstall left
                behind, which never open the app again. A phone still in the
                field comes straight back. */}
            <p className="text-xs text-gray-400 text-center">
              If the app is still installed, opening it registers the device
              again.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmRemove(false)}
              disabled={removing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={removeDevice}
              disabled={removing}
            >
              {removing ? 'Removing...' : 'Remove'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FleetView
