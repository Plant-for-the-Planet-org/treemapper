'use client'

import { useMemo } from 'react'
import Map, { Layer, NavigationControl, Source } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { PublicPageSiteFeature } from '../types'

/**
 * Site boundaries on a basemap.
 *
 * Deliberately modest: no satellite toggle, no popups, no tree points. The
 * public page publishes polygons only, so there is nothing here to click
 * through to.
 *
 * Scroll zoom is off. A tall page with a live map that swallows the wheel is
 * the quickest way to trap a reader halfway down.
 *
 * Bounds are computed here rather than with turf: the only thing needed is a
 * bbox, and keeping turf out saves a large dependency on a page whose whole
 * point is loading fast when a link is shared.
 */

const BASEMAP = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

type Bounds = [number, number, number, number]

function walk(coords: unknown, acc: Bounds): void {
  if (!Array.isArray(coords)) return
  if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    const [lng, lat] = coords as [number, number]
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return
    acc[0] = Math.min(acc[0], lng)
    acc[1] = Math.min(acc[1], lat)
    acc[2] = Math.max(acc[2], lng)
    acc[3] = Math.max(acc[3], lat)
    return
  }
  for (const part of coords) walk(part, acc)
}

function boundsOf(features: PublicPageSiteFeature[]): Bounds | null {
  const acc: Bounds = [Infinity, Infinity, -Infinity, -Infinity]
  for (const feature of features) {
    walk((feature.geometry as { coordinates?: unknown } | null)?.coordinates, acc)
  }
  if (!Number.isFinite(acc[0]) || !Number.isFinite(acc[3])) return null

  // A project with one tiny site collapses to a zero-width box, which maplibre
  // cannot fit. Pad it out to something it can zoom to.
  if (acc[0] === acc[2]) {
    acc[0] -= 0.002
    acc[2] += 0.002
  }
  if (acc[1] === acc[3]) {
    acc[1] -= 0.002
    acc[3] += 0.002
  }
  return acc
}

export function SiteMap({
  features,
  height,
  accent,
}: {
  features: PublicPageSiteFeature[]
  height: number
  /** Resolved colour, because maplibre paint values cannot read CSS variables. */
  accent: string
}) {
  // The payload types geometry as `unknown`, because the web package does not
  // want a GeoJSON dependency just to pass it through. Narrow it once, here,
  // where maplibre actually needs the real shape.
  const collection = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: features.map((feature) => ({
        type: 'Feature' as const,
        properties: feature.properties,
        geometry: feature.geometry as GeoJSON.Geometry,
      })),
    }),
    [features],
  )

  const bounds = useMemo(() => boundsOf(features), [features])

  // One dot per site, at its bounding-box centre. A restoration site of a few
  // dozen hectares is a couple of pixels once the view is fitted to a project
  // that spans a whole region, so the polygons alone read as an empty map.
  // The dots mark every site at low zoom and hand over to the real boundaries
  // as the reader zooms in.
  const centroids = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: features.flatMap((feature) => {
        const acc: Bounds = [Infinity, Infinity, -Infinity, -Infinity]
        walk((feature.geometry as { coordinates?: unknown } | null)?.coordinates, acc)
        if (!Number.isFinite(acc[0]) || !Number.isFinite(acc[3])) return []
        return [
          {
            type: 'Feature' as const,
            properties: feature.properties,
            geometry: {
              type: 'Point' as const,
              coordinates: [(acc[0] + acc[2]) / 2, (acc[1] + acc[3]) / 2],
            },
          },
        ]
      }),
    }),
    [features],
  )

  if (!features.length || !bounds) {
    return (
      <div
        className="flex items-center justify-center text-sm"
        style={{
          height,
          background: 'var(--pp-placeholder)',
          borderRadius: 'var(--pp-radius)',
          color: 'var(--pp-muted)',
        }}
      >
        No published site boundaries yet.
      </div>
    )
  }

  return (
    <div
      className="overflow-hidden"
      style={{ height, borderRadius: 'var(--pp-radius)', background: 'var(--pp-placeholder)' }}
    >
      <Map
        initialViewState={{
          bounds,
          fitBoundsOptions: { padding: 48, maxZoom: 14 },
        }}
        mapStyle={BASEMAP}
        scrollZoom={false}
        dragRotate={false}
        touchPitch={false}
        attributionControl={{ compact: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <Source id="pp-sites" type="geojson" data={collection}>
          <Layer id="pp-sites-fill" type="fill" paint={{ 'fill-color': accent, 'fill-opacity': 0.35 }} />
          <Layer id="pp-sites-line" type="line" paint={{ 'line-color': accent, 'line-width': 2 }} />
        </Source>
        <Source id="pp-sites-centroids" type="geojson" data={centroids}>
          {/* Full size until the boundaries are big enough to carry the map
              on their own (a ~50 ha site is readable from about zoom 11),
              then gone, so a zoomed-in view never shows a dot on a polygon. */}
          <Layer
            id="pp-sites-dots"
            type="circle"
            paint={{
              'circle-color': accent,
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 12, 0],
              'circle-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.85, 12, 0],
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 12, 0],
            }}
          />
        </Source>
        {/* Scroll zoom stays off so the page does not trap the wheel, which
            makes these buttons the only way in to a small site. */}
        <NavigationControl position="top-right" showCompass={false} />
      </Map>
    </div>
  )
}
