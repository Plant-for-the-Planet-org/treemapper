'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, MapPin } from 'lucide-react'
import { area as turfArea } from '@turf/turf'
import { getUserProjectSites } from '@shared-core/fetchApi/api.fetch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState, SectionCard, StatCard } from './primitives'
import { downloadCsv } from '@/utils/spreadsheet'
import type { ApiResponse } from '../lib/api'
import { formatNumber, safeFileName } from '../lib/format'

interface Site {
  uid?: string
  name?: string
  description?: string
  status?: string
  originalGeometry?: GeoJSON.Geometry | GeoJSON.Feature | null
  area?: number | null
  createdBy?: { name?: string; email?: string }
  createdAt?: string
}

/**
 * Area comes from the stored geometry where there is one. `site.area` is
 * already in hectares on this table, unlike interventions which store square
 * metres, so it is used as-is.
 */
function siteAreaHa(site: Site): number | null {
  if (site.originalGeometry) {
    try {
      return turfArea(site.originalGeometry) / 10000
    } catch {
      // fall through to the stored value
    }
  }
  return site.area != null ? Number(site.area) : null
}

export function SitesPanel({
  token,
  projectUid,
  projectName,
}: {
  token: string
  projectUid: string
  projectName: string
}) {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token || !projectUid) return
    let cancelled = false

    setLoading(true)
    getUserProjectSites(token, projectUid)
      .then((res: ApiResponse<Site[] | { sites: Site[] }>) => {
        if (cancelled || res?.statusCode !== 200) return
        setSites(Array.isArray(res.data) ? res.data : (res.data?.sites ?? []))
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, projectUid])

  const activeSites = useMemo(() => sites.filter((s) => s.status !== 'deactivated'), [sites])

  const totalArea = useMemo(
    () => activeSites.reduce((sum, site) => sum + (siteAreaHa(site) ?? 0), 0),
    [activeSites],
  )

  const exportRows = useMemo(
    () =>
      activeSites.map((site) => {
        const areaHa = siteAreaHa(site)
        return {
          name: site.name ?? '',
          site_id: site.uid ?? '',
          status: site.status ?? '',
          area_ha: areaHa != null ? Number(areaHa.toFixed(4)) : '',
          description: site.description ?? '',
          created_by: site.createdBy?.name ?? '',
          created_at: site.createdAt ? new Date(site.createdAt).toISOString() : '',
          geometry: site.originalGeometry ? JSON.stringify(site.originalGeometry) : '',
        }
      }),
    [activeSites],
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Total Sites" value={formatNumber(activeSites.length)} icon={MapPin} loading={loading} />
        <StatCard
          title="Total Area"
          value={`${totalArea.toFixed(2)} ha`}
          icon={MapPin}
          loading={loading}
        />
      </div>

      <SectionCard
        title="Sites"
        controls={
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={activeSites.length === 0}
            onClick={() => downloadCsv(exportRows, `${safeFileName(projectName)}__Sites`)}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
        contentClassName="px-0"
      >
        {loading ? (
          <Skeleton className="h-52 w-full mx-6" />
        ) : activeSites.length === 0 ? (
          <EmptyState message="No sites found" />
        ) : (
          <div className="max-h-[480px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6">Name</TableHead>
                  <TableHead className="px-6 text-right">Area (ha)</TableHead>
                  <TableHead className="px-6">Status</TableHead>
                  <TableHead className="px-6">Created by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSites.map((site, index) => {
                  const areaHa = siteAreaHa(site)
                  return (
                    <TableRow key={site.uid ?? index}>
                      <TableCell className="px-6">{site.name ?? 'Unnamed'}</TableCell>
                      <TableCell className="px-6 text-right">
                        {areaHa != null ? areaHa.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell className="px-6">
                        <Badge variant="secondary" className="text-xs font-normal capitalize">
                          {site.status ?? 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 text-muted-foreground">
                        {site.createdBy?.name ?? '-'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
