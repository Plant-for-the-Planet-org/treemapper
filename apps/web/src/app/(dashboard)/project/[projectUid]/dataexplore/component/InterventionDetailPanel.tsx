'use client'

import { MapPin, TreePine } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber } from '../lib/format'

export interface MapSampleTree {
  uid: string
  hid: string
  tag: string | null
  species: string | null
  height: number | null
  width: number | null
  status: string
}

export interface InterventionDetail {
  properties: {
    uid: string
    hid: string
    type: string
    interventionStartDate: string
    captureMode: string
    captureStatus: string
    description: string | null
    image: string | null
    siteName: string | null
    areaHa: number | null
  }
  plantedSpecies: { scientificName: string; treeCount: number }[]
  totalPlantedTrees: number
  sampleTrees: MapSampleTree[]
  totalSampleTrees: number
}

const TYPE_LABELS: Record<string, string> = {
  'single-tree-registration': 'Single Tree',
  'multi-tree-registration': 'Multiple Trees',
}

/** HIDs read better grouped, the way the old Data Explorer showed them: ABC-123. */
function formatHid(hid: string): string {
  return hid.length === 6 ? `${hid.slice(0, 3)}-${hid.slice(3)}` : hid
}

export function InterventionDetailPanel({
  detail,
  density,
  loading,
}: {
  detail: InterventionDetail | null
  density: number
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 p-6 text-center">
        <MapPin className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Select a location on the map to see its species and sample trees.
        </p>
      </div>
    )
  }

  const { properties } = detail

  return (
    <div className="h-full overflow-auto">
      <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <span className="text-sm font-medium">
          {TYPE_LABELS[properties.type] ?? properties.type}
        </span>
        <span className="text-xs text-muted-foreground font-mono">#{formatHid(properties.hid)}</span>
      </header>

      <div className="grid grid-cols-2 gap-3 px-4 py-3 border-b">
        <div>
          <p className="text-xs text-muted-foreground">Trees planted</p>
          <p className="text-sm font-semibold">{formatNumber(detail.totalPlantedTrees)}</p>
        </div>
        {density > 0 ? (
          <div>
            <p className="text-xs text-muted-foreground">Planting density</p>
            <p className="text-sm font-semibold">{formatNumber(Math.round(density))} / ha</p>
          </div>
        ) : null}
        <div>
          <p className="text-xs text-muted-foreground">Start date</p>
          <p className="text-sm">
            {new Date(properties.interventionStartDate).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        {properties.areaHa != null ? (
          <div>
            <p className="text-xs text-muted-foreground">Area</p>
            <p className="text-sm">{properties.areaHa.toFixed(2)} ha</p>
          </div>
        ) : null}
        {properties.siteName ? (
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground">Site</p>
            <p className="text-sm">{properties.siteName}</p>
          </div>
        ) : null}
      </div>

      <section className="px-4 py-3 border-b">
        <p className="text-xs font-medium mb-2">
          Species planted ({detail.plantedSpecies.length})
        </p>
        {detail.plantedSpecies.length === 0 ? (
          <p className="text-xs text-muted-foreground">No species recorded.</p>
        ) : (
          <ul className="space-y-1.5">
            {detail.plantedSpecies.map((species) => (
              <li
                key={species.scientificName}
                className="flex items-center justify-between gap-2 text-xs"
                title={species.scientificName}
              >
                <span className="italic truncate">{species.scientificName}</span>
                <span className="shrink-0 tabular-nums">
                  {formatNumber(species.treeCount)}
                  {detail.totalPlantedTrees > 1 ? (
                    <span className="text-muted-foreground ml-1">
                      {((species.treeCount / detail.totalPlantedTrees) * 100).toFixed(1)}%
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {detail.sampleTrees.length > 0 ? (
        <section className="px-4 py-3">
          <p className="text-xs font-medium mb-2">Sample trees ({detail.totalSampleTrees})</p>
          <ul className="space-y-2">
            {detail.sampleTrees.map((tree, index) => (
              <li key={tree.uid} className="text-xs">
                <p className="flex items-center gap-1.5">
                  <TreePine className="h-3 w-3 text-primary shrink-0" />
                  <span className="text-muted-foreground">{index + 1}.</span>
                  <span className="italic truncate">{tree.species ?? 'Unknown species'}</span>
                  {tree.status !== 'alive' ? (
                    <Badge variant="secondary" className="text-[10px] font-normal capitalize">
                      {tree.status}
                    </Badge>
                  ) : null}
                </p>
                <p className="text-muted-foreground pl-[18px]">
                  {tree.tag ? `Tag #${tree.tag}` : `#${formatHid(tree.hid)}`}
                  {tree.height != null ? ` • ${tree.height} m high` : ''}
                  {tree.width != null ? ` • ${tree.width} cm wide` : ''}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {properties.description ? (
        <section className="px-4 py-3 border-t">
          <p className="text-xs font-medium mb-1">Notes</p>
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{properties.description}</p>
        </section>
      ) : null}
    </div>
  )
}
