'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Download, TreePine, Users, MapPin, Leaf, Calendar as CalendarIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useToken } from '@/context/useTokenContext'
import useProjectStore from '@shared-core/store/useProjectStore'
import {
  getProjectIntervention,
  getProjectSpecies,
  getTeamMemebers,
  getUserProjectSites,
  exportAllData,
} from '@shared-core/fetchApi/api.fetch'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

// ---- helpers ----

function getDaysBefore(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function labelDate(s: string): string {
  return parseDate(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function groupByMonth(items: any[], dateKey: string) {
  const map: Record<string, number> = {}
  items.forEach(item => {
    const raw = item[dateKey]
    if (!raw) return
    const d = new Date(raw)
    if (isNaN(d.getTime())) return
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    map[key] = (map[key] || 0) + 1
  })
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }))
}

function withCumulative(items: { month: string; count: number }[]) {
  let running = 0
  return items.map(item => {
    running += item.count
    return { ...item, cumulative: running }
  })
}

function toCsvString(rows: Record<string, any>[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  return [
    headers.join(','),
    ...rows.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(',')),
  ].join('\n')
}

function triggerCsvDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ---- sub-components ----

const DATE_PRESETS = [
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
  { label: 'All', days: 3650 },
]

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  loading: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <p className="text-2xl font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ---- page ----

export default function DataExplorePage() {
  const { accessToken } = useToken()
  const selectedProject = useProjectStore(state => state.selectedProject)
  const projectRole = useProjectStore(state => state.selectedProject?.userRole)

  const [startDate, setStartDate] = useState(getDaysBefore(365))
  const [endDate, setEndDate] = useState(todayStr())
  const [pickerRange, setPickerRange] = useState<DateRange | undefined>({
    from: parseDate(getDaysBefore(365)),
    to: parseDate(todayStr()),
  })
  const [activePreset, setActivePreset] = useState('1y')
  const [activeTab, setActiveTab] = useState('interventions')

  const [interventions, setInterventions] = useState<any[]>([])
  const [species, setSpecies] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])

  const [loadingInterventions, setLoadingInterventions] = useState(false)
  const [loadingSpecies, setLoadingSpecies] = useState(false)
  const [loadingTeam, setLoadingTeam] = useState(false)
  const [loadingSites, setLoadingSites] = useState(false)
  const [exporting, setExporting] = useState(false)

  const projectId = selectedProject?.uid
  const canAccess = projectRole === 'admin' || projectRole === 'owner'
  const loadedTabs = useRef(new Set<string>())
  const isFirstDateRender = useRef(true)

  // TODO: replace this client-side paging + aggregation with a server-side
  // analytics endpoint. Fetching every intervention page-by-page into the
  // browser and computing per-month counts / tree totals here does not scale
  // (a large project = many sequential requests, re-run on every date change).
  // The backend should expose a stats/summary route that takes the project +
  // date range and returns pre-aggregated numbers (the date-range pattern
  // already exists in exportAllData).
  const fetchAllInterventions = async (token: string, projId: string) => {
    const all: any[] = []
    let page = 1
    let totalPages = 1
    do {
      const res = await getProjectIntervention(token, projId, { limit: 100, page })
      if (!res || res.statusCode !== 200) break
      all.push(...(res.data?.intervention ?? []))
      totalPages = res.data?.pagination?.totalPages ?? 1
      page++
    } while (page <= totalPages)
    return all
  }

  // Fetch interventions + species when project or auth becomes available
  useEffect(() => {
    if (!selectedProject?.uid || !accessToken) return
    isFirstDateRender.current = true

    setLoadingInterventions(true)
    fetchAllInterventions(accessToken, selectedProject.uid)
      .then(all => setInterventions(all))
      .catch(() => toast.error('Failed to load interventions'))
      .finally(() => setLoadingInterventions(false))

    setLoadingSpecies(true)
    getProjectSpecies(accessToken, selectedProject.uid)
      .then(res => {
        if (res?.statusCode === 200) {
          const d = res.data ?? {}
          setSpecies([...(d.knownSpecies ?? []), ...(d.unknownSpecies ?? [])])
        }
      })
      .finally(() => setLoadingSpecies(false))

    loadedTabs.current = new Set()
    setTeam([])
    setSites([])
  }, [selectedProject, accessToken])

  // Re-fetch interventions when date filter changes (skip initial mount)
  useEffect(() => {
    if (isFirstDateRender.current) {
      isFirstDateRender.current = false
      return
    }
    if (!selectedProject?.uid || !accessToken) return
    setLoadingInterventions(true)
    fetchAllInterventions(accessToken, selectedProject.uid)
      .then(all => setInterventions(all))
      .catch(() => toast.error('Failed to load interventions'))
      .finally(() => setLoadingInterventions(false))
  }, [startDate, endDate])

  // Fetch team + sites lazily on first tab visit
  useEffect(() => {
    if (!selectedProject?.uid || !accessToken) return

    if (activeTab === 'team' && !loadedTabs.current.has('team')) {
      loadedTabs.current.add('team')
      setLoadingTeam(true)
      getTeamMemebers(accessToken, selectedProject.uid)
        .then(res => {
          if (res?.statusCode === 200) setTeam(res.data?.members ?? [])
        })
        .finally(() => setLoadingTeam(false))
    }

    if (activeTab === 'sites' && !loadedTabs.current.has('sites')) {
      loadedTabs.current.add('sites')
      setLoadingSites(true)
      getUserProjectSites(accessToken, selectedProject.uid)
        .then(res => {
          if (res?.statusCode === 200) setSites(Array.isArray(res.data) ? res.data : res.data?.sites ?? [])
        })
        .finally(() => setLoadingSites(false))
    }
  }, [selectedProject, accessToken, activeTab])

  // client-side date filter for interventions
  const filtered = useMemo(() => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    return interventions.filter(i => {
      const raw = i.interventionStartDate ?? i.createdAt
      if (!raw) return true
      const d = new Date(raw)
      return d >= start && d <= end
    })
  }, [interventions, startDate, endDate])

  const byMonth = useMemo(() => groupByMonth(filtered, 'interventionStartDate'), [filtered])
  const cumulativeData = useMemo(() => withCumulative(byMonth), [byMonth])

  const totalTrees = useMemo(() =>
    filtered.reduce((sum, i) => {
      const fromSpecies = (i.species ?? []).reduce(
        (s: number, sp: any) => s + (sp.speciesCount ?? sp.treeCount ?? 0), 0
      )
      return sum + (fromSpecies || i.treeCount || 0)
    }, 0),
    [filtered]
  )

  const speciesChartData = useMemo(() =>
    species
      .map(s => ({
        name: s.commonName ?? s.scientificName ?? s.speciesName ?? 'Unknown',
        count: s.totalSpecimenCount ?? s.speciesCount ?? 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    [species]
  )

  const teamByRole = useMemo(() => {
    const map: Record<string, number> = {}
    team.forEach(m => { map[m.role ?? 'member'] = (map[m.role ?? 'member'] || 0) + 1 })
    return Object.entries(map).map(([role, count]) => ({ role, count }))
  }, [team])

  // export handlers
  const handleExportInterventions = async () => {
    setExporting(true)
    try {
      const res = await exportAllData(
        accessToken,
        { startDate: new Date(startDate), endDate: new Date(endDate) },
        projectId
      )
      if (res?.statusCode === 200 || res?.statusCode === 201) {
        const rows = (res.data.interventions ?? []).map((i: any) => ({
          type: i.interventionType ?? i.type ?? '',
          startDate: i.interventionStartDate ?? '',
          endDate: i.interventionEndDate ?? '',
          treeCount: i.treeCount ?? 0,
          status: i.status ?? '',
          site: i.site?.name ?? i.siteName ?? '',
          country: i.country ?? '',
          speciesCount: Array.isArray(i.species) ? i.species.length : (i.speciesCount ?? ''),
          originalGeometry: i.originalGeometry ? JSON.stringify(i.originalGeometry) : '',
        }))
        triggerCsvDownload(toCsvString(rows), 'interventions-export.csv')
        toast.success('Interventions exported')
      }
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const handleExportSpecies = () => {
    if (!species.length) { toast.warn('No species data'); return }
    triggerCsvDownload(
      toCsvString(species.map(s => ({
        name: s.aliases?.[0] ?? s.scientificName ?? s.speciesName ?? s.name ?? '',
        scientificName: s.scientificName ?? '',
        treeCount: s.treeCount ?? s.count ?? 0,
        status: s.isDisabled ? 'disabled' : 'active',
      }))),
      'species-export.csv'
    )
  }

  const handleExportTeam = () => {
    if (!team.length) { toast.warn('No team data'); return }
    triggerCsvDownload(
      toCsvString(team.map(m => ({
        name: m.user?.name ?? '',
        email: m.user?.email ?? '',
        role: m.role ?? 'member',
      }))),
      'team-export.csv'
    )
  }

  const handleExportSites = () => {
    if (!sites.length) { toast.warn('No sites data'); return }
    triggerCsvDownload(
      toCsvString(sites.map(s => ({
        name: s.name ?? '',
        area: s.area ?? '',
        status: s.status ?? 'active',
      }))),
      'sites-export.csv'
    )
  }

  const applyPreset = (label: string, days: number) => {
    const start = getDaysBefore(days)
    const end = todayStr()
    setActivePreset(label)
    setStartDate(start)
    setEndDate(end)
    setPickerRange({ from: parseDate(start), to: parseDate(end) })
  }

  if (!canAccess) {
    return (
      <div className="flex h-full w-full items-center justify-center pt-24">
        <p className="text-muted-foreground text-sm">Admin or owner access required.</p>
      </div>
    )
  }

  return (
    <div className="w-full min-h-full bg-background pt-4 pb-12">
      {/* Header */}
      <div className="px-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Data Explorer</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Visualize and export your project data
            </p>
          </div>

          {/* Date controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex">
              {DATE_PRESETS.map((p, idx) => (
                <Button
                  key={p.label}
                  variant={activePreset === p.label ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => applyPreset(p.label, p.days)}
                  className={cn(
                    'rounded-none',
                    idx === 0 && 'rounded-l-md',
                    idx === DATE_PRESETS.length - 1 && 'rounded-r-md',
                    idx !== 0 && 'border-l-0',
                  )}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {labelDate(startDate)} – {labelDate(endDate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  numberOfMonths={2}
                  defaultMonth={parseDate(startDate)}
                  selected={pickerRange}
                  onSelect={(range: DateRange | undefined) => {
                    setPickerRange(range)
                    setActivePreset('')
                    if (range?.from && range?.to) {
                      setStartDate(fmtDate(range.from))
                      setEndDate(fmtDate(range.to))
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 w-full justify-start">
            <TabsTrigger value="interventions">Interventions</TabsTrigger>
            <TabsTrigger value="species">Species</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="sites">Sites</TabsTrigger>
          </TabsList>

          {/* ---- Interventions ---- */}
          <TabsContent value="interventions" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title="Total Interventions"
                value={filtered.length.toLocaleString()}
                icon={TreePine}
                loading={loadingInterventions}
              />
              <StatCard
                title="Trees Planted"
                value={totalTrees.toLocaleString()}
                icon={Leaf}
                loading={loadingInterventions}
              />
              <StatCard
                title="Active Sites"
                value={sites.length.toLocaleString()}
                icon={MapPin}
                loading={loadingSites}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Interventions per Month</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingInterventions ? (
                    <Skeleton className="h-52 w-full" />
                  ) : byMonth.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-16">No data for selected range</p>
                  ) : (
                    <div className="h-[210px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={byMonth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ border: '1px solid var(--border)', borderRadius: 0, fontSize: 12 }}
                            cursor={{ fill: 'var(--muted)' }}
                          />
                          <Bar dataKey="count" fill="var(--primary)" radius={[2, 2, 0, 0]} name="Interventions" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cumulative Interventions</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingInterventions ? (
                    <Skeleton className="h-52 w-full" />
                  ) : cumulativeData.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-16">No data for selected range</p>
                  ) : (
                    <div className="h-[210px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cumulativeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ border: '1px solid var(--border)', borderRadius: 0, fontSize: 12 }}
                          />
                          <Area
                            type="monotone"
                            dataKey="cumulative"
                            stroke="var(--primary)"
                            strokeWidth={2}
                            fill="url(#gradGreen)"
                            name="Cumulative"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleExportInterventions} disabled={exporting} size="sm">
                <Download className="h-4 w-4" />
                {exporting ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>
          </TabsContent>

          {/* ---- Species ---- */}
          <TabsContent value="species" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title="Total Species"
                value={species.length}
                icon={Leaf}
                loading={loadingSpecies}
              />
              <StatCard
                title="Active"
                value={species.filter(s => !s.isDisabled).length}
                icon={Leaf}
                loading={loadingSpecies}
              />
              <StatCard
                title="Total Trees (all time)"
                value={species.reduce((s, r) => s + (r.totalSpecimenCount ?? r.speciesCount ?? 0), 0).toLocaleString()}
                icon={TreePine}
                loading={loadingSpecies}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top 10 Species by Tree Count</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSpecies ? (
                  <Skeleton className="h-56 w-full" />
                ) : speciesChartData.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-16">No species data</p>
                ) : (
                  <div className="w-full" style={{ height: Math.max(180, speciesChartData.length * 30) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={speciesChartData}
                        layout="vertical"
                        margin={{ top: 4, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          width={130}
                        />
                        <Tooltip
                          contentStyle={{ border: '1px solid var(--border)', borderRadius: 0, fontSize: 12 }}
                          cursor={{ fill: 'var(--muted)' }}
                        />
                        <Bar dataKey="count" fill="var(--primary)" radius={[0, 2, 2, 0]} name="Trees" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleExportSpecies} variant="outline" size="sm">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </TabsContent>

          {/* ---- Team ---- */}
          <TabsContent value="team" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                title="Total Members"
                value={team.length}
                icon={Users}
                loading={loadingTeam}
              />
              <StatCard
                title="Roles"
                value={teamByRole.length}
                icon={Users}
                loading={loadingTeam}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Members by Role</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingTeam ? (
                    <Skeleton className="h-52 w-full" />
                  ) : teamByRole.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-16">No team data</p>
                  ) : (
                    <div className="h-[210px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={teamByRole} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="role" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ border: '1px solid var(--border)', borderRadius: 0, fontSize: 12 }}
                            cursor={{ fill: 'var(--muted)' }}
                          />
                          <Bar dataKey="count" fill="var(--primary)" radius={[2, 2, 0, 0]} name="Members" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Team List</CardTitle>
                </CardHeader>
                <CardContent className="overflow-auto max-h-56 px-0">
                  {loadingTeam ? (
                    <Skeleton className="h-52 w-full mx-6" />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-6">Name</TableHead>
                          <TableHead className="px-6">Role</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {team.slice(0, 30).map((m, i) => (
                          <TableRow key={m.id ?? i}>
                            <TableCell className="px-6">
                              {m.user?.name ?? m.user?.email ?? 'Unknown'}
                            </TableCell>
                            <TableCell className="px-6">
                              <Badge variant="secondary" className="text-xs capitalize font-normal">
                                {m.role ?? 'member'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleExportTeam} variant="outline" size="sm">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </TabsContent>

          {/* ---- Sites ---- */}
          <TabsContent value="sites" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                title="Total Sites"
                value={sites.length}
                icon={MapPin}
                loading={loadingSites}
              />
              <StatCard
                title="Active"
                value={sites.filter(s => !s.status || s.status === 'active').length}
                icon={MapPin}
                loading={loadingSites}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">All Sites</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                {loadingSites ? (
                  <Skeleton className="h-52 w-full mx-6" />
                ) : sites.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-16">No sites found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-6">Name</TableHead>
                        <TableHead className="px-6">Area (ha)</TableHead>
                        <TableHead className="px-6">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sites.map((s, i) => (
                        <TableRow key={s.id ?? i}>
                          <TableCell className="px-6">{s.name ?? 'Unnamed'}</TableCell>
                          <TableCell className="px-6">
                            {s.area != null ? Number(s.area).toFixed(2) : '–'}
                          </TableCell>
                          <TableCell className="px-6">
                            <Badge
                              variant={s.status === 'active' || !s.status ? 'default' : 'secondary'}
                              className="text-xs font-normal capitalize"
                            >
                              {s.status ?? 'active'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleExportSites} variant="outline" size="sm">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
