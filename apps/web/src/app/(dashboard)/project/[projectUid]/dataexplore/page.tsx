'use client'

import { useEffect, useState } from 'react'
import { Leaf, Map as MapIcon, MapPin, TreePine, Trees } from 'lucide-react'
import { toast } from 'react-toastify'
import { useToken } from '@/context/useTokenContext'
import useProjectStore from '@shared-core/store/useProjectStore'
import { getDataExplorerSummary } from '@shared-core/fetchApi/api.fetch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DateRangeControls } from './component/DateRangeControls'
import type { DateRange } from './component/DateRangeControls'
import { ExportPanel } from './component/ExportPanel'
import { MapPanel } from './component/MapPanel'
import { OverviewPanel } from './component/OverviewPanel'
import { SitesPanel } from './component/SitesPanel'
import { SpeciesPanel } from './component/SpeciesPanel'
import { StatCard } from './component/primitives'
import { ProjectRoleGate } from '@/component/ProjectRoleGate'
import { isProjectAdmin } from '@/lib/projectAccess'
import { TeamPanel } from './component/TeamPanel'
import type { ApiResponse } from './lib/api'
import { formatCompact, formatNumber, getDaysBefore, todayStr } from './lib/format'

interface Summary {
  totalTreesPlanted: number
  totalSpeciesPlanted: number
  totalInterventions: number
  totalSampleTrees: number
  totalAreaHa: number
}

const EMPTY_SUMMARY: Summary = {
  totalTreesPlanted: 0,
  totalSpeciesPlanted: 0,
  totalInterventions: 0,
  totalSampleTrees: 0,
  totalAreaHa: 0,
}

function DataExplorer() {
  const { accessToken } = useToken()
  const selectedProject = useProjectStore((state) => state.selectedProject)
  const projectRole = useProjectStore((state) => state.selectedProject?.userRole)

  const projectUid = selectedProject?.uid ?? ''
  const projectName = selectedProject?.name ?? 'Project'
  // ProjectRoleGate below has already refused anyone else; this only stops the
  // fetch firing in the frame before an unmount, and documents the dependency.
  const canAccess = isProjectAdmin(projectRole)

  const [range, setRange] = useState<DateRange>({
    startDate: getDaysBefore(365),
    endDate: todayStr(),
  })
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY)
  const [loadingSummary, setLoadingSummary] = useState(false)

  // The counters follow the date range, and every tab reads the same range,
  // so a number on one tab always means the same window as a number on another.
  useEffect(() => {
    if (!accessToken || !projectUid || !canAccess) return
    let cancelled = false

    setLoadingSummary(true)
    getDataExplorerSummary(accessToken, projectUid, {
      startDate: range.startDate,
      endDate: range.endDate,
    })
      .then((res: ApiResponse<Summary>) => {
        if (cancelled) return
        if (res?.statusCode === 200) setSummary(res.data ?? EMPTY_SUMMARY)
        else toast.error('Could not load project totals')
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load project totals')
      })
      .finally(() => {
        if (!cancelled) setLoadingSummary(false)
      })

    return () => {
      cancelled = true
    }
  }, [accessToken, projectUid, canAccess, range.startDate, range.endDate])

  // SidebarInset is `flex flex-col overflow-hidden min-h-0`, so the parent never
  // scrolls: each page owns its own scroll container. `min-h-0` is the
  // load-bearing part -- without it a flex child refuses to shrink below its
  // content height and the overflow is simply clipped, which looks like a page
  // that is cut off and will not scroll.
  return (
    <div className="w-full flex-1 min-h-0 overflow-y-auto bg-background pt-4 pb-12">
      <div className="px-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Data Explorer</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Explore, map and export {projectName}
            </p>
          </div>
          <DateRangeControls range={range} onChange={setRange} />
        </div>
      </div>

      <div className="px-6 mb-6 grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Trees Planted"
          value={formatCompact(summary.totalTreesPlanted)}
          hint={formatNumber(summary.totalTreesPlanted)}
          icon={Trees}
          loading={loadingSummary}
        />
        <StatCard
          title="Species Planted"
          value={formatCompact(summary.totalSpeciesPlanted)}
          icon={Leaf}
          loading={loadingSummary}
        />
        <StatCard
          title="Interventions"
          value={formatCompact(summary.totalInterventions)}
          hint={formatNumber(summary.totalInterventions)}
          icon={TreePine}
          loading={loadingSummary}
        />
        <StatCard
          title="Sample Trees"
          value={formatCompact(summary.totalSampleTrees)}
          icon={TreePine}
          loading={loadingSummary}
        />
        <StatCard
          title="Area Covered"
          value={`${summary.totalAreaHa.toFixed(1)} ha`}
          icon={MapIcon}
          loading={loadingSummary}
        />
      </div>

      <div className="px-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 w-full justify-start flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="map" className="gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Map
            </TabsTrigger>
            <TabsTrigger value="species">Species</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="sites">Sites</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          {/* Each panel owns its own fetching and only mounts when opened, so
              opening the page does not fire six requests at once. */}
          <TabsContent value="overview">
            <OverviewPanel
              token={accessToken}
              projectUid={projectUid}
              projectName={projectName}
              range={range}
            />
          </TabsContent>

          <TabsContent value="map">
            <MapPanel token={accessToken} projectUid={projectUid} range={range} />
          </TabsContent>

          <TabsContent value="species">
            <SpeciesPanel
              token={accessToken}
              projectUid={projectUid}
              projectName={projectName}
              range={range}
            />
          </TabsContent>

          <TabsContent value="team">
            <TeamPanel token={accessToken} projectUid={projectUid} projectName={projectName} />
          </TabsContent>

          <TabsContent value="sites">
            <SitesPanel token={accessToken} projectUid={projectUid} projectName={projectName} />
          </TabsContent>

          <TabsContent value="export">
            <ExportPanel
              token={accessToken}
              projectUid={projectUid}
              projectName={projectName}
              range={range}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

/**
 * Owner and admin only. The gate mirrors `@ProjectRoles('owner', 'admin')` on
 * every `/data-explorer/*` route plus `/analytics/:id/export`, so a contributor
 * who types the URL sees a clear refusal instead of a page of failed requests.
 */
export default function DataExplorePage() {
  return (
    <ProjectRoleGate label="The Data Explorer">
      <DataExplorer />
    </ProjectRoleGate>
  )
}
