'use client'

import React, { useMemo, useState } from 'react'
import {
  Smartphone, Search, Send, ChevronLeft, Globe, Clock, Tag, Bell, CircleSlash,
  BatteryLow, BatteryFull, HardDrive, Wifi, WifiOff, Signal, RefreshCw,
  MapPin, ArrowUpCircle, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Device } from './mockData'
import { LATEST_APP_VERSION, needsUpdate } from './mockData'
import {
  platformLabel, initials, relativeTime, formatDate, networkLabel,
  levelColor, levelBar,
} from './helpers'

const NetworkIcon = ({ type, size = 14 }: { type: Device['networkType']; size?: number }) => {
  if (type === 'wifi') return <Wifi size={size} className="text-green-600" />
  if (type === 'cellular') return <Signal size={size} className="text-green-600" />
  return <WifiOff size={size} className="text-gray-400" />
}

const Meter = ({
  label, icon: Icon, pct, invert, suffix = '%',
}: {
  label: string
  icon: React.ElementType
  pct: number
  invert?: boolean
  suffix?: string
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-gray-500">
        <Icon size={13} className="text-gray-400" />
        {label}
      </span>
      <span className={cn('font-semibold tabular-nums', levelColor(pct, invert))}>
        {pct}{suffix}
      </span>
    </div>
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all', levelBar(pct, invert))}
        style={{ width: `${Math.max(pct, 3)}%` }}
      />
    </div>
  </div>
)

interface Props {
  devices: Device[]
  selectedUid: string | null
  onSelect: (uid: string) => void
  onNotify: (device: Device) => void
}

const FleetView = ({ devices, selectedUid, onSelect, onNotify }: Props) => {
  const [search, setSearch] = useState('')
  const [platform, setPlatform] = useState<'all' | 'ios' | 'android'>('all')
  const [status, setStatus] = useState<'all' | 'online' | 'pending' | 'inactive'>('all')
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return devices.filter(d => {
      if (platform !== 'all' && d.deviceOs !== platform) return false
      if (status === 'online' && !d.online) return false
      if (status === 'pending' && d.pendingInterventions === 0) return false
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
                <SelectItem value="pending">Has pending sync</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
              <Smartphone size={28} className="text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No devices match your filters</p>
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
                        {device.pendingInterventions > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                            <RefreshCw size={10} />
                            {device.pendingInterventions} queued
                          </span>
                        )}
                        {needsUpdate(device) && (
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
            onBack={() => setMobileView('list')}
            onNotify={() => onNotify(selectedDevice)}
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
}) => {
  const outdated = needsUpdate(device)
  const reachable = device.notificationPermission && device.isActive
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
              <Badge variant="outline" className="text-[10px]">{device.user.role}</Badge>
            </div>
            <p className="text-xs text-gray-500 truncate">{device.user.email}</p>
          </div>
        </div>
        <Badge variant={device.online ? 'default' : 'secondary'} className={device.online ? 'bg-green-600' : ''}>
          {device.online ? 'Online' : device.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Telemetry meters */}
      <div className="grid grid-cols-2 gap-x-5 gap-y-3 rounded-xl border border-border p-4">
        <Meter
          label="Battery" pct={device.batteryLevel} invert
          icon={device.batteryLevel <= 20 ? BatteryLow : BatteryFull}
        />
        <Meter label="Storage used" pct={device.storageUsedPct} icon={HardDrive} />
        <div className="col-span-2 flex items-center justify-between pt-1 border-t border-border">
          <span className="flex items-center gap-2 text-xs text-gray-500">
            <NetworkIcon type={device.networkType} />
            {networkLabel(device.networkType)}
          </span>
          {device.pendingInterventions > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
              <RefreshCw size={13} />
              {device.pendingInterventions} interventions · {device.pendingTrees} trees queued
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
              <CheckCircle2 size={13} />
              Fully synced
            </span>
          )}
        </div>
      </div>

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
            {outdated ? (
              <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200">
                {LATEST_APP_VERSION} available
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">latest</Badge>
            )}
          </span>
        } />
        <DetailRow icon={MapPin} label="Site" value={device.site || '-'} />
        <DetailRow icon={Globe} label="Locale" value={device.locale || '-'} />
        <DetailRow icon={Globe} label="Timezone" value={device.timezone || '-'} />
        <DetailRow
          icon={device.notificationPermission ? Bell : CircleSlash}
          label="Notifications"
          value={device.notificationPermission
            ? <span className="text-green-700">Enabled</span>
            : <span className="text-gray-400">Disabled</span>}
        />
        <DetailRow icon={RefreshCw} label="Last sync" value={relativeTime(device.lastSyncAt)} />
        <DetailRow icon={Clock} label="Last active" value={relativeTime(device.lastActiveAt)} />
        <DetailRow icon={Clock} label="Registered" value={formatDate(device.createdAt)} />
      </div>

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
    </div>
  )
}

export default FleetView
