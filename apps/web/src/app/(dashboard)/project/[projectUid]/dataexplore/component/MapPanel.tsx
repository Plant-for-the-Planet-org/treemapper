'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, { Layer, NavigationControl, Source } from 'react-map-gl/maplibre'
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/maplibre'
import type { StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { bbox } from '@turf/turf'
import { Layers, Search } from 'lucide-react'
import { toast } from 'react-toastify'
import {
  getDataExplorerInterventionDetail,
  getDataExplorerMapInterventions,
  getDataExplorerMapSites,
  getDataExplorerMapSpecies,
} from '@shared-core/fetchApi/api.fetch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DateRange } from './DateRangeControls'
import type { ApiResponse, FeatureCollectionOf } from '../lib/api'
import { InterventionDetailPanel } from './InterventionDetailPanel'
import type { InterventionDetail } from './InterventionDetailPanel'
import { formatNumber } from '../lib/format'

const STREET_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
const SATELLITE_STYLE = {
  version: 8 as const,
  sources: {
    'esri-satellite': {
      type: 'raster' as const,
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: '© Esri',
    },
  },
  layers: [{ id: 'esri-satellite-layer', type: 'raster' as const, source: 'esri-satellite' }],
}

const ALL_SITES = '__all__'

interface InterventionFeature {
  type: 'Feature'
  geometry: GeoJSON.Geometry
  properties: {
    uid: string
    hid: string
    type: string
    treeCount: number
    density: number
    opacity: number
    interventionStartDate: string
  }
}

interface SiteFeature {
  type: 'Feature'
  geometry: GeoJSON.Geometry
  properties: { uid: string; name: string; status: string | null; areaHa: number | null }
}

const EMPTY_COLLECTION: FeatureCollectionOf<InterventionFeature> = {
  type: 'FeatureCollection',
  features: [],
}

const HID_PATTERN = /^[A-Za-z0-9]{6}$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function MapPanel({
  token,
  projectUid,
  range,
}: {
  token: string
  projectUid: string
  range: DateRange
}) {
  const mapRef = useRef<MapRef | null>(null)

  const [speciesList, setSpeciesList] = useState<string[]>(['All'])
  const [species, setSpecies] = useState('All')
  const [sites, setSites] = useState<SiteFeature[]>([])
  const [siteUid, setSiteUid] = useState<string>(ALL_SITES)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const [features, setFeatures] = useState<InterventionFeature[]>([])
  const [loading, setLoading] = useState(false)

  const [selected, setSelected] = useState<InterventionFeature['properties'] | null>(null)
  const [detail, setDetail] = useState<InterventionDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [satellite, setSatellite] = useState(false)

  // Anything that is not an HID or a YYYY-MM-DD date is not a query the server
  // can answer, so it is not sent. Telling the user beats silently ignoring it.
  const searchKind = useMemo(() => {
    const value = search.trim()
    if (!value) return 'empty' as const
    if (HID_PATTERN.test(value)) return 'hid' as const
    if (DATE_PATTERN.test(value) && !isNaN(new Date(value).getTime())) return 'date' as const
    return 'invalid' as const
  }, [search])

  // Debounce typing so each keystroke does not hit the API.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 500)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Filter options load once per project.
  useEffect(() => {
    if (!token || !projectUid) return
    let cancelled = false

    getDataExplorerMapSpecies(token, projectUid).then((res: ApiResponse<{ data: string[] }>) => {
      if (!cancelled && res?.statusCode === 200) setSpeciesList(res.data?.data ?? ['All'])
    })

    getDataExplorerMapSites(token, projectUid).then(
      (res: ApiResponse<FeatureCollectionOf<SiteFeature>>) => {
        if (!cancelled && res?.statusCode === 200) setSites(res.data?.features ?? [])
      },
    )

    return () => {
      cancelled = true
    }
  }, [token, projectUid])

  // Interventions reload whenever any filter changes.
  useEffect(() => {
    if (!token || !projectUid) return
    let cancelled = false

    setLoading(true)
    getDataExplorerMapInterventions(token, projectUid, {
      startDate: range.startDate,
      endDate: range.endDate,
      species: species === 'All' ? undefined : species,
      siteUid: siteUid === ALL_SITES ? undefined : siteUid,
      search: searchKind === 'hid' || searchKind === 'date' ? search.trim() : undefined,
    })
      .then((res: ApiResponse<FeatureCollectionOf<InterventionFeature>>) => {
        if (cancelled) return
        if (res?.statusCode === 200) {
          const next: InterventionFeature[] = res.data?.features ?? []
          setFeatures(next)
          setSelected(next.length > 0 ? next[0].properties : null)
        } else {
          toast.error('Could not load map data')
        }
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load map data')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, projectUid, range.startDate, range.endDate, species, siteUid, search, searchKind])

  // Detail panel follows the selection.
  useEffect(() => {
    if (!token || !projectUid || !selected) {
      setDetail(null)
      return
    }
    let cancelled = false

    setDetailLoading(true)
    getDataExplorerInterventionDetail(token, projectUid, selected.uid)
      .then((res: ApiResponse<InterventionDetail>) => {
        if (!cancelled && res?.statusCode === 200) setDetail(res.data ?? null)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, projectUid, selected])

  const collection = useMemo(
    () => ({ type: 'FeatureCollection' as const, features }),
    [features],
  )

  const siteCollection = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features:
        siteUid === ALL_SITES ? sites : sites.filter((s) => s.properties.uid === siteUid),
    }),
    [sites, siteUid],
  )

  const fitTo = useCallback((data: GeoJSON.FeatureCollection | FeatureCollectionOf<InterventionFeature | SiteFeature>, maxZoom = 16) => {
    const map = mapRef.current
    if (!map || !data?.features?.length) return
    try {
      const [minX, minY, maxX, maxY] = bbox(data as GeoJSON.FeatureCollection)
      if (![minX, minY, maxX, maxY].every(Number.isFinite)) return
      map.fitBounds(
        [
          [minX, minY],
          [maxX, maxY],
        ],
        { padding: 48, duration: 600, maxZoom },
      )
    } catch {
      // A malformed geometry should not take the map down.
    }
  }, [])

  // Frame the results whenever the set of interventions changes.
  useEffect(() => {
    if (features.length > 0) fitTo(collection)
    else if (siteCollection.features.length > 0) fitTo(siteCollection, 13)
  }, [collection, siteCollection, features.length, fitTo])

  const handleSiteChange = (value: string) => {
    setSiteUid(value)
    if (value !== ALL_SITES) {
      const site = sites.find((s) => s.properties.uid === value)
      if (site) fitTo({ type: 'FeatureCollection', features: [site] }, 14)
    }
  }

  const handleMapClick = (event: MapLayerMouseEvent) => {
    const feature = event?.features?.[0]
    if (!feature?.properties?.uid) return
    if (feature.properties.uid === selected?.uid) return
    setSelected({
      uid: feature.properties.uid,
      hid: feature.properties.hid,
      type: feature.properties.type,
      treeCount: Number(feature.properties.treeCount ?? 0),
      density: Number(feature.properties.density ?? 0),
      opacity: Number(feature.properties.opacity ?? 0.2),
      interventionStartDate: feature.properties.interventionStartDate,
    })
  }

  const totalTrees = useMemo(
    () => features.reduce((sum, f) => sum + (f.properties.treeCount || 0), 0),
    [features],
  )

  return (
    <Card className="overflow-hidden p-0 gap-0">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <Select value={siteUid} onValueChange={handleSiteChange}>
          <SelectTrigger size="sm" className="w-[190px]">
            <SelectValue placeholder="Site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SITES}>All sites</SelectItem>
            {sites.map((site) => (
              <SelectItem key={site.properties.uid} value={site.properties.uid}>
                {site.properties.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value="interventions" onValueChange={() => undefined}>
          <SelectTrigger size="sm" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="interventions">Interventions</SelectItem>
            <SelectItem value="monitoring-plots" disabled>
              Monitoring plots (soon)
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={species} onValueChange={setSpecies}>
          <SelectTrigger size="sm" className="w-[220px]">
            <SelectValue placeholder="Species" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {speciesList.map((name) => (
              <SelectItem key={name} value={name}>
                {name === 'All' ? 'All species' : name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={14} />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by HID or date"
            className={cn('h-8 w-[220px] pl-8 text-sm', searchKind === 'invalid' && 'border-destructive')}
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {loading
              ? 'Loading...'
              : `${formatNumber(features.length)} locations • ${formatNumber(totalTrees)} trees`}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setSatellite((value) => !value)}
          >
            <Layers className="h-4 w-4" />
            {satellite ? 'Street' : 'Satellite'}
          </Button>
        </div>
      </div>

      {searchKind === 'invalid' ? (
        <p className="px-3 py-2 text-xs text-destructive border-b">
          Search takes a 6 character HID or a date as YYYY-MM-DD. Showing all results for now.
        </p>
      ) : null}

      {/* Map plus detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
        <div className="relative h-[560px]">
          <Map
            ref={mapRef}
            mapStyle={satellite ? (SATELLITE_STYLE as unknown as StyleSpecification) : STREET_STYLE}
            initialViewState={{ longitude: 0, latitude: 0, zoom: 1.4 }}
            style={{ width: '100%', height: '100%' }}
            // The page scrolls, and a map that grabs the wheel traps the user
            // half way down it. Zoom is via the NavigationControl or a
            // double-click instead, matching InterventionDisplayMap and the
            // platform Data Explorer this replaced.
            scrollZoom={false}
            interactiveLayerIds={['de-intervention-fill', 'de-intervention-point']}
            onClick={handleMapClick}
            onMouseEnter={() => {
              const map = mapRef.current?.getMap?.()
              if (map) map.getCanvas().style.cursor = 'pointer'
            }}
            onMouseLeave={() => {
              const map = mapRef.current?.getMap?.()
              if (map) map.getCanvas().style.cursor = ''
            }}
          >
            <NavigationControl position="top-right" />

            {/* Site outlines sit under the interventions for context. */}
            <Source id="de-sites" type="geojson" data={siteCollection as unknown as GeoJSON.FeatureCollection}>
              <Layer
                id="de-site-line"
                type="line"
                paint={{ 'line-color': '#64748b', 'line-width': 1.5, 'line-dasharray': [2, 2] }}
              />
            </Source>

            <Source
              id="de-interventions"
              type="geojson"
              data={(collection ?? EMPTY_COLLECTION) as unknown as GeoJSON.FeatureCollection}
            >
              {/* Opacity carries planting density, the way the old explorer shaded plots. */}
              <Layer
                id="de-intervention-fill"
                type="fill"
                filter={['!=', ['geometry-type'], 'Point']}
                paint={{ 'fill-color': '#007A49', 'fill-opacity': ['get', 'opacity'] }}
              />
              <Layer
                id="de-intervention-line"
                type="line"
                filter={['!=', ['geometry-type'], 'Point']}
                paint={{ 'line-color': '#007A49', 'line-width': 1.5, 'line-opacity': 0.9 }}
              />
              <Layer
                id="de-intervention-point"
                type="circle"
                filter={['==', ['geometry-type'], 'Point']}
                paint={{
                  'circle-radius': 5,
                  'circle-color': '#007A49',
                  'circle-stroke-color': '#ffffff',
                  'circle-stroke-width': 1.5,
                }}
              />
              {/* Selection highlight. Split by geometry type because a line
                  layer paints nothing on a Point, which would leave a selected
                  single-tree registration with no visible marker. */}
              <Layer
                id="de-intervention-selected"
                type="line"
                filter={[
                  'all',
                  ['!=', ['geometry-type'], 'Point'],
                  ['==', ['get', 'uid'], selected?.uid ?? ''],
                ]}
                paint={{ 'line-color': '#f59e0b', 'line-width': 3 }}
              />
              <Layer
                id="de-intervention-selected-point"
                type="circle"
                filter={[
                  'all',
                  ['==', ['geometry-type'], 'Point'],
                  ['==', ['get', 'uid'], selected?.uid ?? ''],
                ]}
                paint={{
                  'circle-radius': 8,
                  'circle-color': '#007A49',
                  'circle-stroke-color': '#f59e0b',
                  'circle-stroke-width': 3,
                }}
              />
            </Source>
          </Map>

          {!loading && features.length === 0 ? (
            <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
              <span className="rounded-md bg-background/90 border px-3 py-1.5 text-xs text-muted-foreground">
                No locations match these filters
              </span>
            </div>
          ) : null}
        </div>

        <div className="border-t lg:border-t-0 lg:border-l h-[560px]">
          <InterventionDetailPanel
            detail={detail}
            density={selected?.density ?? 0}
            loading={detailLoading}
          />
        </div>
      </div>
    </Card>
  )
}
