'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Smartphone, Wifi, BellRing, BellOff, Search, Send, ChevronLeft,
  RefreshCw, Globe, Clock, Tag, CircleCheck, CircleSlash, Bell,
} from 'lucide-react'
import { toast } from 'react-toastify'
import { formatDistanceToNowStrict } from 'date-fns'
import useProjectStore from '@shared-core/store/useProjectStore'
import { useToken } from '@/context/useTokenContext'
import { getProjectDevices } from '@shared-core/fetchApi/api.fetch'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import SendNotificationDialog, { NotifyTarget } from './SendNotificationDialog'

export interface DeviceUser {
  uid: string
  name: string
  email: string
  image: string | null
}

export interface Device {
  uid: string
  deviceId: string
  deviceName: string | null
  deviceModel: string | null
  deviceOs: string | null
  osVersion: string | null
  appVersion: string | null
  locale: string | null
  timezone: string | null
  notificationPermission: boolean
  isActive: boolean
  online: boolean
  lastActiveAt: string | null
  createdAt: string
  updatedAt: string
  user: DeviceUser
}

interface Stats {
  total: number
  online: number
  notificationsEnabled: number
  inactive: number
  ios: number
  android: number
}

const EMPTY_STATS: Stats = {
  total: 0, online: 0, notificationsEnabled: 0, inactive: 0, ios: 0, android: 0,
}

function platformLabel(os: string | null): string {
  if (!os) return 'Unknown'
  const lower = os.toLowerCase()
  if (lower === 'ios') return 'iOS'
  if (lower === 'android') return 'Android'
  return os
}

function initials(name: string): string {
  if (!name) return 'U'
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function relativeTime(value: string | null): string {
  if (!value) return 'Never'
  try {
    return `${formatDistanceToNowStrict(new Date(value))} ago`
  } catch {
    return '-'
  }
}

function formatDate(value: string | null): string {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch {
    return '-'
  }
}

const StatCard = ({
  title, value, subtitle, icon: Icon, loading,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  loading?: boolean
}) => (
  <Card className="flex-shrink-0 min-w-[150px] w-full py-0">
    <CardContent className="px-3 py-2.5">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xs font-medium text-gray-500 leading-tight">{title}</h3>
        <div className="bg-green-50 p-1.5 rounded-xl">
          <Icon size={16} className="text-[#007A49]" />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-6 w-12" />
      ) : (
        <p className="text-xl font-bold text-gray-900 tracking-tight">{value}</p>
      )}
      {subtitle && !loading && (
        <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
      )}
    </CardContent>
  </Card>
)

const DeviceManagement = () => {
  const [devices, setDevices] = useState<Device[]>([])
  const [stats, setStats] = useState<Stats>(EMPTY_STATS)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [platform, setPlatform] = useState<'all' | 'ios' | 'android'>('all')
  const [status, setStatus] = useState<'all' | 'online' | 'active' | 'inactive'>('all')
  const [selectedUid, setSelectedUid] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')

  const [notifyOpen, setNotifyOpen] = useState(false)
  const [notifyTarget, setNotifyTarget] = useState<NotifyTarget>('fleet')
  const [notifyDevice, setNotifyDevice] = useState<Device | null>(null)

  const selectedProject = useProjectStore(state => state.selectedProject)
  const { accessToken } = useToken()
  const projectUid = selectedProject?.uid

  const fetchDevices = async () => {
    if (!projectUid) return
    setLoading(true)
    try {
      const res = await getProjectDevices(accessToken || '', projectUid)
      if (res?.statusCode === 200 && res.data) {
        const list: Device[] = res.data.devices || []
        setDevices(list)
        setStats(res.data.stats || EMPTY_STATS)
        setSelectedUid(prev => prev && list.some(d => d.uid === prev) ? prev : (list[0]?.uid ?? null))
      } else {
        toast.error(res?.message || 'Could not load devices')
      }
    } catch {
      toast.error('Could not load devices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectUid) fetchDevices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectUid])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return devices.filter(d => {
      if (platform !== 'all' && (d.deviceOs || '').toLowerCase() !== platform) return false
      if (status === 'online' && !d.online) return false
      if (status === 'active' && !d.isActive) return false
      if (status === 'inactive' && d.isActive) return false
      if (!term) return true
      return [
        d.user.name, d.user.email, d.deviceName, d.deviceModel, platformLabel(d.deviceOs),
      ].some(v => (v || '').toLowerCase().includes(term))
    })
  }, [devices, search, platform, status])

  const selectedDevice = useMemo(
    () => devices.find(d => d.uid === selectedUid) ?? null,
    [devices, selectedUid],
  )

  const openFleetNotify = () => {
    setNotifyTarget('fleet')
    setNotifyDevice(null)
    setNotifyOpen(true)
  }

  const openDeviceNotify = (device: Device) => {
    setNotifyTarget('selected')
    setNotifyDevice(device)
    setNotifyOpen(true)
  }

  return (
    <div className="w-full h-full flex flex-col p-4 gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="bg-green-50 p-2 rounded-xl">
            <Smartphone size={20} className="text-[#007A49]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Mobile devices</h1>
            <p className="text-xs text-gray-500">
              Devices of members using the TreeMapper mobile app
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDevices} disabled={loading}>
            <RefreshCw size={14} className={cn('mr-1.5', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={openFleetNotify}
            disabled={stats.notificationsEnabled === 0}
            className="bg-[#007A49] hover:bg-green-700 text-white"
          >
            <Send size={14} className="mr-1.5" />
            Send notification
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Devices total" value={stats.total} loading={loading}
          subtitle={`${stats.ios} iOS · ${stats.android} Android`} icon={Smartphone} />
        <StatCard title="Online now" value={stats.online} loading={loading}
          subtitle="Active in last 15 min" icon={Wifi} />
        <StatCard title="Notifications on" value={stats.notificationsEnabled} loading={loading}
          subtitle="Reachable devices" icon={BellRing} />
        <StatCard title="Inactive" value={stats.inactive} loading={loading}
          subtitle="Signed out devices" icon={BellOff} />
      </div>

      {/* List + detail */}
      <div className="flex-1 flex min-h-0 border border-border rounded-xl overflow-hidden bg-card">
        {/* List */}
        <div className={cn(
          'w-full md:w-[360px] md:flex-shrink-0 border-r border-border flex flex-col min-h-0',
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
              <Select value={platform} onValueChange={(v: any) => setPlatform(v)}>
                <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All platforms</SelectItem>
                  <SelectItem value="ios">iOS</SelectItem>
                  <SelectItem value="android">Android</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
                <Smartphone size={28} className="text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">
                  {devices.length === 0 ? 'No registered devices yet' : 'No devices match your filters'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map(device => (
                  <li key={device.uid}>
                    <button
                      onClick={() => { setSelectedUid(device.uid); setMobileView('detail') }}
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
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {platformLabel(device.deviceOs)}
                        </Badge>
                        <span className="text-[10px] text-gray-400">{relativeTime(device.lastActiveAt)}</span>
                      </div>
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
              onBack={() => setMobileView('list')}
              onNotify={() => openDeviceNotify(selectedDevice)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Smartphone size={32} className="text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Select a device to see details</p>
            </div>
          )}
        </div>
      </div>

      <SendNotificationDialog
        open={notifyOpen}
        onOpenChange={setNotifyOpen}
        projectUid={projectUid || ''}
        token={accessToken || ''}
        target={notifyTarget}
        device={notifyDevice}
        fleetCount={stats.notificationsEnabled}
      />
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
  device, onBack, onNotify,
}: {
  device: Device
  onBack: () => void
  onNotify: () => void
}) => (
  <div className="p-4 md:p-5">
    <button onClick={onBack} className="md:hidden flex items-center gap-1 text-sm text-gray-500 mb-3">
      <ChevronLeft size={16} /> Back
    </button>

    <div className="flex items-start justify-between gap-3 mb-4">
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
          <h2 className="text-base font-semibold text-gray-900 truncate">{device.user.name}</h2>
          <p className="text-xs text-gray-500 truncate">{device.user.email}</p>
        </div>
      </div>
      <Badge variant={device.online ? 'default' : 'secondary'} className={device.online ? 'bg-green-600' : ''}>
        {device.online ? 'Online' : device.isActive ? 'Active' : 'Inactive'}
      </Badge>
    </div>

    <Card className="py-0 mb-4">
      <CardContent className="px-4 py-1">
        <DetailRow icon={Smartphone} label="Device"
          value={device.deviceName || device.deviceModel || 'Unknown'} />
        <DetailRow icon={Tag} label="Model" value={device.deviceModel || '-'} />
        <DetailRow icon={CircleCheck} label="Platform"
          value={`${platformLabel(device.deviceOs)}${device.osVersion ? ` ${device.osVersion}` : ''}`} />
        <DetailRow icon={Tag} label="App version" value={device.appVersion || '-'} />
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
      </CardContent>
    </Card>

    <Button
      onClick={onNotify}
      disabled={!device.notificationPermission || !device.isActive}
      className="w-full bg-[#007A49] hover:bg-green-700 text-white"
    >
      <Send size={15} className="mr-1.5" />
      Send notification to this device
    </Button>
    {(!device.notificationPermission || !device.isActive) && (
      <p className="text-[11px] text-gray-400 text-center mt-2">
        This device cannot receive notifications right now.
      </p>
    )}
  </div>
)

export default DeviceManagement
