'use client'

// Map view for TreeMatch. Draws the loaded plant locations colored by match
// status. Clicking a location opens a small card with its numbers and an
// "Add to match" button that feeds the same selection state as the list view,
// so a match started on the map finishes through the normal bottom action bar.
// Map plumbing (basemaps, layer patterns) follows the overview GlobalMap.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import * as turf from '@turf/turf';
import {
  TreePine, Sprout, MapPin, X, Check, Plus, ArrowLeftRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  BASEMAP_STYLES, BASEMAP_OPTIONS, type BasemapKey,
} from '../../overview/component/map/constants';
import { TreeMatchIntervention, fmtTrees, fmtDate, availableTrees } from './types';

// Colors by match status. Selected locations use the brand green so "in the
// match" reads at a glance; the legend mirrors these.
const STATUS_COLOR = {
  available: '#68B030',
  matched: '#94A3B8',
} as const;
const SELECTED_COLOR = '#007A49';

type MatchStatus = keyof typeof STATUS_COLOR;

const statusOf = (i: TreeMatchIntervention): MatchStatus =>
  availableTrees(i) > 0 ? 'available' : 'matched';

// Stable references — react-map-gl re-applies these on reference change.
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };
const INTERACTIVE_LAYER_IDS = ['tm-areas-fill'];
const INITIAL_VIEW = { longitude: -90.14, latitude: 18.41, zoom: 10.5 };

const fmtShort = (n: number) =>
  n >= 1000 ? `${parseFloat((n / 1000).toFixed(1))}k` : String(n);

const LEGEND: { label: string; color: string }[] = [
  { label: 'Available', color: STATUS_COLOR.available },
  { label: 'Selected', color: SELECTED_COLOR },
  { label: 'Fully matched', color: STATUS_COLOR.matched },
];

interface Props {
  /** already filtered by the left-pane filters */
  interventions: TreeMatchIntervention[];
  selected: Set<string>;
  /** uid of the location whose detail card is open on the map */
  focusUid: string | null;
  onFocusChange: (uid: string | null) => void;
  onToggle: (uid: string) => void;
  /** the selection already covers the chosen donations, so this location cannot
   * be added right now. Without it the button below would look live and do
   * nothing, since the parent's toggle refuses blocked locations. */
  isBlocked?: (uid: string) => boolean;
  className?: string;
}

export function TreeMatchMap({ interventions, selected, focusUid, onFocusChange, onToggle, isBlocked, className }: Props) {
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [basemap, setBasemap] = useState<BasemapKey>('satellite');
  const [hoverCursor, setHoverCursor] = useState(false);

  // Some interventions carry no stored geometry -- they simply don't render.
  const locatable = useMemo(() => interventions.filter(i => i.location), [interventions]);

  // One marker per location at its point / polygon centroid.
  const markers = useMemo(() => locatable.map(i => {
    try {
      const c = i.location!.type === 'Point'
        ? (i.location!.coordinates as [number, number])
        : (turf.centroid(i.location as any).geometry.coordinates as [number, number]);
      return { i, lng: c[0], lat: c[1], status: statusOf(i), available: availableTrees(i) };
    } catch {
      return null;
    }
  }).filter((m): m is NonNullable<typeof m> => m !== null), [locatable]);

  const areaGeoJSON = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: locatable
      .filter(i => i.location!.type !== 'Point')
      .map(i => ({
        type: 'Feature' as const,
        properties: {
          uid: i.uid,
          color: selected.has(i.uid) ? SELECTED_COLOR : STATUS_COLOR[statusOf(i)],
          selected: selected.has(i.uid),
          focused: focusUid === i.uid,
        },
        geometry: i.location,
      })),
  }), [locatable, selected, focusUid]);

  const fitAll = useCallback(() => {
    if (locatable.length === 0) return;
    try {
      const fc = turf.featureCollection(locatable.map(i => turf.feature(i.location as any)));
      const [minX, minY, maxX, maxY] = turf.bbox(fc);
      mapRef.current?.fitBounds([minX, minY, maxX, maxY], { padding: 70, duration: 800, maxZoom: 14.5 });
    } catch { /* ignore */ }
  }, [locatable]);

  const handleLoad = useCallback(() => { setMapLoaded(true); }, []);
  useEffect(() => { if (mapLoaded) fitAll(); }, [mapLoaded, fitAll]);

  // Center on the focused location (marker click or "View on map" in the list).
  useEffect(() => {
    if (!focusUid || !mapLoaded) return;
    const m = markers.find(x => x.i.uid === focusUid);
    const map = mapRef.current;
    if (!m || !map) return;
    map.easeTo({ center: [m.lng, m.lat], zoom: Math.max(map.getZoom?.() ?? 0, 13.5), duration: 700 });
  }, [focusUid, mapLoaded, markers]);

  const handleMapClick = useCallback((e: any) => {
    const uid = e.features?.[0]?.properties?.uid;
    onFocusChange(uid ?? null);
  }, [onFocusChange]);

  const focus = interventions.find(i => i.uid === focusUid) ?? null;
  const focusAvailable = focus ? availableTrees(focus) : 0;
  const focusPct = focus && focus.totalTreeCount > 0 ? Math.round((focus.matchedTrees / focus.totalTreeCount) * 100) : 0;
  const focusSelected = !!focus && selected.has(focus.uid);
  const focusInactive = !!focus && focusAvailable === 0;
  const focusBlocked = !!focus && !focusSelected && !!isBlocked?.(focus.uid);
  const FocusIcon = focus?.type === 'single-tree-registration' ? Sprout : TreePine;

  return (
    <div className={cn('relative overflow-hidden rounded-lg border border-border bg-muted/40', className)}>
      <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW}
        style={MAP_CONTAINER_STYLE}
        mapStyle={BASEMAP_STYLES[basemap]}
        interactiveLayerIds={INTERACTIVE_LAYER_IDS}
        cursor={hoverCursor ? 'pointer' : 'grab'}
        onLoad={handleLoad}
        onClick={handleMapClick}
        onMouseMove={e => setHoverCursor(!!e.features?.length)}
        onMouseLeave={() => setHoverCursor(false)}
        attributionControl={false}
      >
        {areaGeoJSON.features.length > 0 && (
          <Source id="tm-areas" type="geojson" data={areaGeoJSON as any}>
            <Layer
              id="tm-areas-fill"
              type="fill"
              paint={{
                'fill-color': ['get', 'color'],
                'fill-opacity': ['case', ['get', 'selected'], 0.35, ['get', 'focused'], 0.3, 0.18],
              }}
            />
            <Layer
              id="tm-areas-outline"
              type="line"
              paint={{
                'line-color': ['get', 'color'],
                'line-width': ['case', ['any', ['get', 'selected'], ['get', 'focused']], 3, 1.5],
              }}
            />
          </Source>
        )}

        {/* Count chips. HTML markers so we get full styling without map glyphs. */}
        {markers.map(m => {
          const isSel = selected.has(m.i.uid);
          const isFocus = focusUid === m.i.uid;
          return (
            <Marker key={m.i.uid} longitude={m.lng} latitude={m.lat} anchor="center">
              <button
                type="button"
                title={m.i.hid}
                onClick={e => { e.stopPropagation(); onFocusChange(isFocus ? null : m.i.uid); }}
                className={cn(
                  'flex items-center gap-1 rounded-full border-2 border-white px-2 py-0.5 text-[11px] font-bold text-white shadow-md transition-transform cursor-pointer',
                  isFocus && 'scale-110 ring-2 ring-white/70',
                )}
                style={{ backgroundColor: isSel ? SELECTED_COLOR : STATUS_COLOR[m.status] }}
              >
                {isSel && <Check size={11} strokeWidth={3} />}
                {m.available > 0 ? fmtShort(m.available) : 'Full'}
              </button>
            </Marker>
          );
        })}
      </Map>

      {/* Basemap switcher */}
      <div className="absolute top-3 right-3 z-10">
        <Select value={basemap} onValueChange={v => setBasemap(v as BasemapKey)}>
          <SelectTrigger size="sm" className="w-[110px] bg-background/95 shadow-md border-border text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BASEMAP_OPTIONS.map(o => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 right-3 z-10 rounded-lg border border-border bg-background/95 shadow-md px-3 py-2 space-y-1">
        {LEGEND.map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      {interventions.length === 0 && (
        <div className="absolute inset-x-0 top-3 z-10 flex justify-center pointer-events-none">
          <span className="rounded-lg bg-background/95 border border-border shadow-md px-3 py-1.5 text-xs text-muted-foreground">
            No plant locations match these filters.
          </span>
        </div>
      )}

      {/* Detail card for the clicked location */}
      {focus && (
        <div className="absolute bottom-3 left-3 z-10 w-[300px] rounded-xl border border-border bg-card text-card-foreground shadow-lg overflow-hidden">
          <div className="px-4 pt-3 pb-1 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FocusIcon size={15} className="flex-shrink-0 text-primary" />
                <span className="text-sm font-bold truncate">{focus.hid}</span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.08em] rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground flex-shrink-0">
                  {focus.type === 'single-tree-registration' ? 'single' : 'multi'}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin size={12} className="flex-shrink-0" />
                <span className="truncate">{focus.siteName || 'No site'}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="whitespace-nowrap">{fmtDate(focus.interventionStartDate)}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon-xs" className="text-muted-foreground flex-shrink-0" onClick={() => onFocusChange(null)}>
              <X size={14} />
            </Button>
          </div>

          <div className="px-4 pb-3.5">
            <div className="flex items-end justify-between mb-1.5 mt-1.5">
              <span className="text-xs text-muted-foreground">
                <span className="text-lg font-bold text-foreground leading-none">{fmtTrees(focusAvailable)}</span> available
              </span>
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{fmtTrees(focus.matchedTrees)}</span> / {fmtTrees(focus.totalTreeCount)} matched
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-primary/15 overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${focusPct}%` }} />
            </div>

            {focus.crossProjectName && (
              <div className="mt-2.5 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[10px] gap-1 rounded-full text-blue-700 border-blue-200 bg-blue-50">
                  <ArrowLeftRight size={10} /> {focus.crossProjectName}
                </Badge>
              </div>
            )}

            {focusInactive ? (
              <Button size="sm" className="w-full mt-3" disabled>
                Fully matched
              </Button>
            ) : focusSelected ? (
              <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => onToggle(focus.uid)}>
                <X size={13} /> Remove from match
              </Button>
            ) : focusBlocked ? (
              <Button size="sm" className="w-full mt-3" disabled>
                Donations already covered
              </Button>
            ) : (
              <Button size="sm" className="w-full mt-3" onClick={() => onToggle(focus.uid)}>
                <Plus size={13} /> Add to match
              </Button>
            )}
            {focusBlocked && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                The locations you picked already cover the selected donations.
              </p>
            )}
            {focusSelected && !focusInactive && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Now pick one or more donations on the right, then press Match trees.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
