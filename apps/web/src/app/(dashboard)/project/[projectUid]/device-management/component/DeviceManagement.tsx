'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Smartphone, Wifi, BellRing, RefreshCw, Send, LayoutGrid, ListFilter,
  History, FileText, ArrowUpCircle, RefreshCcwDot, BatteryLow, TriangleAlert,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

import {
  MOCK_DEVICES, MOCK_CAMPAIGNS, MOCK_TEMPLATES, computeStats,
  appVersionDistribution, LATEST_APP_VERSION,
  type Device, type NotificationCampaign,
} from './mockData'
import { initials, relativeTime } from './helpers'
import FleetView from './FleetView'
import NotificationsView from './NotificationsView'
import TemplatesView from './TemplatesView'
import SendNotificationDialog, { type ComposePrefill } from './SendNotificationDialog'

const BRAND = '#007A49'

const StatCard = ({
  title, value, subtitle, icon: Icon, loading,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  loading?: boolean
}) => (
  <div className="rounded-xl border border-border bg-card px-4 py-3">
    <div className="flex justify-between items-start mb-1.5">
      <h3 className="text-xs font-medium text-gray-500 leading-tight">{title}</h3>
      <div className="bg-green-50 p-1.5 rounded-xl">
        <Icon size={16} className="text-[#007A49]" />
      </div>
    </div>
    {loading ? (
      <Skeleton className="h-7 w-12" />
    ) : (
      <p className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">{value}</p>
    )}
    {subtitle && !loading && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
  </div>
)

const DeviceManagement = () => {
  const [devices, setDevices] = useState<Device[]>([])
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [selectedUid, setSelectedUid] = useState<string | null>(null)

  const [notifyOpen, setNotifyOpen] = useState(false)
  const [prefill, setPrefill] = useState<ComposePrefill>({ target: 'fleet' })

  // Simulate loading the fleet. POC: data is local, no API call.
  const loadFleet = () => {
    setLoading(true)
    setTimeout(() => {
      setDevices(MOCK_DEVICES)
      setCampaigns(MOCK_CAMPAIGNS)
      setSelectedUid(prev => prev ?? MOCK_DEVICES[0]?.uid ?? null)
      setLoading(false)
    }, 450)
  }

  useEffect(() => {
    loadFleet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stats = useMemo(() => computeStats(devices), [devices])
  const versions = useMemo(() => appVersionDistribution(devices), [devices])

  const attention = useMemo(() => devices
    .map(d => {
      if (d.appVersion !== LATEST_APP_VERSION)
        return { d, reason: 'Outdated app', icon: ArrowUpCircle, cls: 'text-blue-600' }
      if (d.pendingInterventions >= 10)
        return { d, reason: `${d.pendingInterventions} unsynced`, icon: RefreshCcwDot, cls: 'text-amber-600' }
      if (d.batteryLevel <= 20)
        return { d, reason: `Battery ${d.batteryLevel}%`, icon: BatteryLow, cls: 'text-red-600' }
      if (d.storageUsedPct >= 85)
        return { d, reason: `Storage ${d.storageUsedPct}%`, icon: TriangleAlert, cls: 'text-amber-600' }
      return null
    })
    .filter(Boolean)
    .slice(0, 6) as { d: Device; reason: string; icon: React.ElementType; cls: string }[],
  [devices])

  const platformData = [
    { name: 'iOS', value: stats.ios, fill: BRAND },
    { name: 'Android', value: stats.android, fill: '#7BC47F' },
  ]

  const openCompose = (p: ComposePrefill) => {
    setPrefill(p)
    setNotifyOpen(true)
  }

  const onSent = (campaign: NotificationCampaign) => {
    setCampaigns(prev => [campaign, ...prev])
    setTab('notifications')
  }

  const goToDevice = (uid: string) => {
    setSelectedUid(uid)
    setTab('fleet')
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Device management</h1>
              <Badge variant="secondary" className="text-[10px]">POC</Badge>
            </div>
            <p className="text-xs text-gray-500">
              Devices of members using the TreeMapper mobile app
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadFleet} disabled={loading}>
            <RefreshCw size={14} className={cn('mr-1.5', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => openCompose({ target: 'fleet' })}
            disabled={stats.notificationsEnabled === 0}
            className="bg-[#007A49] hover:bg-green-700 text-white"
          >
            <Send size={14} className="mr-1.5" />
            Send notification
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex-1 min-h-0 flex flex-col gap-4">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="overview"><LayoutGrid size={14} /> Overview</TabsTrigger>
          <TabsTrigger value="fleet"><ListFilter size={14} /> Fleet</TabsTrigger>
          <TabsTrigger value="notifications"><History size={14} /> Notifications</TabsTrigger>
          <TabsTrigger value="templates"><FileText size={14} /> Templates</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="min-h-0 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard title="Devices total" value={stats.total} loading={loading}
              subtitle={`${stats.ios} iOS · ${stats.android} Android`} icon={Smartphone} />
            <StatCard title="Online now" value={stats.online} loading={loading}
              subtitle="Active in last 15 min" icon={Wifi} />
            <StatCard title="Reachable" value={stats.notificationsEnabled} loading={loading}
              subtitle="Notifications enabled" icon={BellRing} />
            <StatCard title="Pending sync" value={stats.pendingSync} loading={loading}
              subtitle="Interventions queued" icon={RefreshCcwDot} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* App version adoption */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">App version adoption</h3>
                <Badge variant="outline" className="text-[10px] text-green-700 border-green-200">
                  Latest {LATEST_APP_VERSION}
                </Badge>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map(v => (
                    <div key={v.version}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5 font-medium text-gray-700">
                          v{v.version}
                          {!v.outdated && (
                            <Badge variant="outline" className="text-[9px] text-green-600 border-green-200">latest</Badge>
                          )}
                        </span>
                        <span className="text-gray-400 tabular-nums">{v.count} device{v.count !== 1 && 's'}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', v.outdated ? 'bg-amber-400' : 'bg-[#007A49]')}
                          style={{ width: `${(v.count / stats.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {stats.needsUpdate > 0 && (
                    <button
                      onClick={() => openCompose({
                        target: 'segment',
                        title: 'Update to the latest version',
                        message: `TreeMapper ${LATEST_APP_VERSION} is available with sync fixes. Please update when you can.`,
                      })}
                      className="text-xs text-[#007A49] font-medium hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      <ArrowUpCircle size={13} />
                      Nudge {stats.needsUpdate} outdated device{stats.needsUpdate !== 1 && 's'} to update
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Platform split */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Platform split</h3>
              {loading ? (
                <Skeleton className="h-[140px] w-full" />
              ) : (
                <>
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie
                          data={platformData} dataKey="value" nameKey="name"
                          innerRadius={42} outerRadius={62} paddingAngle={2} stroke="none"
                        >
                          {platformData.map(e => <Cell key={e.name} fill={e.fill} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-bold text-gray-900">{stats.total}</span>
                      <span className="text-[10px] text-gray-400">devices</span>
                    </div>
                  </div>
                  <div className="flex justify-center gap-4 mt-1">
                    {platformData.map(p => (
                      <span key={p.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.fill }} />
                        {p.name} <span className="font-semibold tabular-nums">{p.value}</span>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Needs attention */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                <TriangleAlert size={15} className="text-amber-500" /> Needs attention
              </h3>
              <span className="text-xs text-gray-400">{attention.length} device{attention.length !== 1 && 's'}</span>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
              </div>
            ) : attention.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">Everything looks healthy.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attention.map(({ d, reason, icon: Icon, cls }) => (
                  <button
                    key={d.uid}
                    onClick={() => goToDevice(d.uid)}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-[10px] bg-green-700 text-white">{initials(d.user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{d.user.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{relativeTime(d.lastActiveAt)}</p>
                    </div>
                    <span className={cn('inline-flex items-center gap-1 text-xs font-medium flex-shrink-0', cls)}>
                      <Icon size={13} /> {reason}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* FLEET */}
        <TabsContent value="fleet" className="min-h-0 flex flex-col">
          {loading ? (
            <div className="flex-1 border border-border rounded-xl p-3 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : (
            <FleetView
              devices={devices}
              selectedUid={selectedUid}
              onSelect={setSelectedUid}
              onNotify={d => openCompose({ target: 'device', device: d })}
            />
          )}
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications" className="min-h-0 flex flex-col">
          <NotificationsView campaigns={campaigns} onCompose={() => openCompose({ target: 'fleet' })} />
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates" className="min-h-0 flex flex-col">
          <TemplatesView
            templates={MOCK_TEMPLATES}
            onUse={t => openCompose({ target: 'fleet', title: t.title, message: t.message })}
          />
        </TabsContent>
      </Tabs>

      <SendNotificationDialog
        open={notifyOpen}
        onOpenChange={setNotifyOpen}
        prefill={prefill}
        fleetCount={stats.notificationsEnabled}
        onSent={onSent}
      />
    </div>
  )
}

export default DeviceManagement
