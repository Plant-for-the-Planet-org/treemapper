'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, NavigationControl, Source } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  AlertTriangle, CheckCircle2, Download, Eye, EyeOff, ImageIcon, Loader2, MousePointerClick,
  Pencil, RotateCcw, Save, Undo2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnalysisSummary, overlayUrl } from '@/lib/satellite-count/api';
import { imageryStyle, pointInPolygon, polygonFeature } from '@/lib/satellite-count/mapStyle';
import { PolygonGeometry, areaHectares, groundResolution } from '@/lib/satellite-count/mercator';
import {
  PendingJob,
  ReviewPoint,
  buildReviewedCollection,
  clearPendingJob,
  countPoints,
  downloadGeoJSON,
  persistReview,
} from '@/lib/satellite-count/review';

interface Props {
  interventionUid: string;
  interventionHid?: string;
  projectUid?: string;
  reviewer?: { id?: string | number; name?: string };
  polygon: PolygonGeometry;
  job: PendingJob;
  summary: AnalysisSummary;
  warnings: string[];
  initialPoints: ReviewPoint[];
  /** saved review being viewed (starts read-only) vs. fresh result */
  saved?: { reviewedAt: string; reviewedBy?: string };
  /** backend still has the job (processed image available) */
  jobOnServer: boolean;
  onNewCount: () => void;
}

const COLORS = { ai: '#FACC15', manual: '#22D3EE', rejected: '#EF4444' };
const HISTORY_LIMIT = 100;

const fmt = (v: number | null | undefined, digits = 0, suffix = '') =>
  v == null || Number.isNaN(v) ? '—' : `${v.toLocaleString('en-US', { maximumFractionDigits: digits })}${suffix}`;

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex justify-between gap-3 py-1">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground text-right">{children}</span>
  </div>
);

export default function SatelliteCountReview({
  interventionUid, interventionHid, projectUid, reviewer, polygon, job, summary, warnings,
  initialPoints, saved, jobOnServer, onNewCount,
}: Props) {
  const mapRef = useRef<MapRef>(null);
  // points + undo history in one state, so updates stay pure (StrictMode-safe)
  const [edit, setEdit] = useState<{ points: ReviewPoint[]; history: ReviewPoint[][] }>({ points: initialPoints, history: [] });
  const { points, history } = edit;
  const [editing, setEditing] = useState(!saved);
  const [showRemoved, setShowRemoved] = useState(true);
  const [dirty, setDirty] = useState(!saved);
  const [saving, setSaving] = useState(false);
  const [overlayOk, setOverlayOk] = useState(jobOnServer);

  useEffect(() => { setEdit({ points: initialPoints, history: [] }); }, [initialPoints]);

  const counts = useMemo(() => countPoints(points), [points]);
  const areaHa = useMemo(() => areaHectares(polygon), [polygon]);
  const [w, s, e, n] = job.capture.bounds;
  const lat = (s + n) / 2;

  const release = useMemo(() => ({
    releaseNum: job.capture.releaseNum,
    label: job.capture.releaseLabel,
    title: '',
    urlTemplate: job.capture.releaseUrlTemplate,
    metadataLayerUrl: null,
  }), [job.capture]);
  // tiles of the analysed zoom are over-zoomed: the map shows exactly what the model saw
  const mapStyle = useMemo(() => imageryStyle(release, job.capture.zoom), [release, job.capture.zoom]);
  const polygonData = useMemo(() => polygonFeature(polygon), [polygon]);

  const pointData = useMemo(() => {
    const r24 = (d?: number) => ((d && d > 0 ? d : 4) / 2) / groundResolution(lat, 24);
    return {
      type: 'FeatureCollection' as const,
      features: points
        .filter(p => showRemoved || p.status !== 'rejected')
        .map(p => ({
          type: 'Feature' as const,
          properties: {
            key: p.key,
            kind: p.status === 'rejected' ? 'rejected' : p.source,
            r24: r24(p.crownDiameterM),
          },
          geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] },
        })),
    };
  }, [points, showRemoved, lat]);

  const update = useCallback((fn: (prev: ReviewPoint[]) => ReviewPoint[]) => {
    setEdit(st => ({ points: fn(st.points), history: [...st.history.slice(-(HISTORY_LIMIT - 1)), st.points] }));
    setDirty(true);
  }, []);

  const undo = useCallback(() => {
    setEdit(st => (st.history.length
      ? { points: st.history[st.history.length - 1], history: st.history.slice(0, -1) }
      : st));
    setDirty(true);
  }, []);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'z' && editing) {
        ev.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, editing]);

  const onMapClick = (ev: MapLayerMouseEvent) => {
    if (!editing) return;
    const hit = ev.features?.[0];
    if (hit) {
      const key = hit.properties?.key as string;
      update(prev => prev.flatMap(p => {
        if (p.key !== key) return [p];
        if (p.source === 'manual') return []; // remove an added tree
        return [{ ...p, status: p.status === 'rejected' ? 'confirmed' : 'rejected' }]; // toggle AI tree
      }));
      return;
    }
    const { lng, lat: la } = ev.lngLat;
    if (!pointInPolygon(lng, la, polygon)) {
      toast.info('Trees can only be added inside the intervention boundary.');
      return;
    }
    update(prev => [...prev, {
      key: `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      lon: lng, lat: la, source: 'manual', status: 'confirmed',
    }]);
  };

  const buildCollection = () => buildReviewedCollection({
    points, interventionUid, interventionHid, projectUid, job,
    result: { summary, warnings }, reviewer,
  });

  const save = async () => {
    setSaving(true);
    try {
      await persistReview(interventionUid, buildCollection());
      clearPendingJob(interventionUid);
      setDirty(false);
      setEditing(false);
      toast.success(`Saved: ${counts.final.toLocaleString('en-US')} trees (reviewed)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save the review');
    } finally {
      setSaving(false);
    }
  };

  const download = () =>
    downloadGeoJSON(buildCollection(), `satellite-count-${interventionHid || interventionUid}.geojson`);

  const radius: any = ['interpolate', ['exponential', 2], ['zoom'], 10, ['/', ['get', 'r24'], 16384], 24, ['get', 'r24']];
  const colorByKind: any = ['match', ['get', 'kind'], 'manual', COLORS.manual, 'rejected', COLORS.rejected, COLORS.ai];

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-0">
      {/* Map editor */}
      <div className="relative flex-1 min-h-[300px] bg-muted">
        <Map
          ref={mapRef}
          initialViewState={{ bounds: [[w, s], [e, n]], fitBoundsOptions: { padding: 30 } }}
          mapStyle={mapStyle}
          style={{ width: '100%', height: '100%' }}
          maxZoom={23}
          attributionControl={{ compact: true }}
          interactiveLayerIds={['sc-dots', 'sc-crowns']}
          cursor={editing ? 'crosshair' : 'grab'}
          onClick={onMapClick}
          doubleClickZoom={!editing}
        >
          <NavigationControl position="bottom-right" showCompass={false} />
          <Source id="sc-polygon" type="geojson" data={polygonData}>
            <Layer id="sc-polygon-line" type="line" paint={{ 'line-color': '#00E5FF', 'line-width': 2 }} />
          </Source>
          <Source id="sc-points" type="geojson" data={pointData}>
            <Layer
              id="sc-crowns"
              type="circle"
              paint={{
                'circle-radius': radius,
                'circle-color': 'rgba(0,0,0,0)',
                'circle-stroke-color': colorByKind,
                'circle-stroke-width': 1.5,
                'circle-stroke-opacity': ['case', ['==', ['get', 'kind'], 'rejected'], 0.5, 0.9],
              }}
            />
            <Layer
              id="sc-dots"
              type="circle"
              paint={{
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 2, 20, 4.5],
                'circle-color': colorByKind,
                'circle-stroke-color': '#000000',
                'circle-stroke-width': 0.75,
                'circle-opacity': ['case', ['==', ['get', 'kind'], 'rejected'], 0.55, 1],
              }}
            />
          </Source>
        </Map>

        {/* legend + edit hint */}
        <div className="absolute top-3 left-3 rounded-md bg-background/90 px-3 py-2 text-xs shadow-sm backdrop-blur space-y-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS.ai }} />Detected</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS.manual }} />Added</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full opacity-60" style={{ background: COLORS.rejected }} />Removed</span>
          </div>
          {editing && (
            <p className="text-muted-foreground flex items-center gap-1.5">
              <MousePointerClick className="h-3.5 w-3.5" />
              Click empty ground to add a tree · click a marker to remove or restore it
            </p>
          )}
        </div>
      </div>

      {/* Side panel */}
      <div className="w-full md:w-[340px] flex-shrink-0 border-t md:border-t-0 md:border-l border-border overflow-y-auto p-4 space-y-5 text-sm">
        {/* Counts */}
        <section>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-muted-foreground">{saved && !dirty ? 'Reviewed tree count' : 'Tree count'}</div>
              <div className="text-3xl font-semibold text-foreground tabular-nums">{counts.final.toLocaleString('en-US')}</div>
            </div>
            {saved && !dirty ? (
              <span className="flex items-center gap-1 text-xs text-primary"><CheckCircle2 className="h-3.5 w-3.5" /> Human-reviewed</span>
            ) : dirty ? (
              <span className="text-xs text-amber-700">Unsaved changes</span>
            ) : null}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-muted/60 py-2">
              <div className="font-semibold tabular-nums">{counts.ai_detected.toLocaleString('en-US')}</div>
              <div className="text-[11px] text-muted-foreground">AI detected</div>
            </div>
            <div className="rounded-md bg-muted/60 py-2">
              <div className="font-semibold tabular-nums text-destructive">−{counts.ai_rejected.toLocaleString('en-US')}</div>
              <div className="text-[11px] text-muted-foreground">Removed</div>
            </div>
            <div className="rounded-md bg-muted/60 py-2">
              <div className="font-semibold tabular-nums text-sky-700">+{counts.manual_added.toLocaleString('en-US')}</div>
              <div className="text-[11px] text-muted-foreground">Added</div>
            </div>
          </div>
          {saved && !dirty && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Reviewed {new Date(saved.reviewedAt).toLocaleString()}{saved.reviewedBy ? ` by ${saved.reviewedBy}` : ''}
            </p>
          )}
        </section>

        {/* Edit controls */}
        <section className="flex flex-wrap gap-2">
          <Button size="sm" variant={editing ? 'secondary' : 'outline'} onClick={() => setEditing(v => !v)}>
            <Pencil className="h-4 w-4" /> {editing ? 'Editing on' : 'Edit markers'}
          </Button>
          <Button size="sm" variant="outline" onClick={undo} disabled={!editing || !history.length}>
            <Undo2 className="h-4 w-4" /> Undo
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowRemoved(v => !v)}>
            {showRemoved ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showRemoved ? 'Hide removed' : 'Show removed'}
          </Button>
        </section>

        {/* Warnings */}
        {warnings.length > 0 && (
          <section className="space-y-1.5">
            {warnings.map((wn, i) => (
              <p key={i} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-px" />{wn}
              </p>
            ))}
          </section>
        )}

        {/* Analysis details */}
        <section>
          <h4 className="text-xs font-medium text-muted-foreground mb-1">Analysis</h4>
          <div className="text-xs divide-y divide-border">
            <Row label="Area">{fmt(areaHa, 2, ' ha')}</Row>
            <Row label="Trees per hectare">{fmt(areaHa ? counts.final / areaHa : null, 1)}</Row>
            <Row label="Mean confidence">{fmt(summary.mean_score != null ? summary.mean_score * 100 : null, 0, '%')}</Row>
            <Row label="Median crown">{fmt(summary.median_crown_diameter_m, 1, ' m')}</Row>
            <Row label="Canopy cover (est.)">{fmt(summary.canopy_cover_estimate * 100, 0, '%')}</Row>
            <Row label="Model">{summary.model?.split('@')[0]}</Row>
            <Row label="Confidence threshold">{job.minScore}</Row>
            <Row label="Processing time">{fmt(summary.processing_seconds, 1, ' s')}</Row>
          </div>
        </section>

        {/* Imagery details */}
        <section>
          <h4 className="text-xs font-medium text-muted-foreground mb-1">Imagery</h4>
          <div className="text-xs divide-y divide-border">
            <Row label="Photo date">{job.capture.imagery?.date ?? 'Unknown'}</Row>
            <Row label="Provider">{[job.capture.imagery?.provider, job.capture.imagery?.source].filter(Boolean).join(' · ') || '—'}</Row>
            <Row label="Wayback version">{job.capture.releaseLabel}</Row>
            <Row label="Zoom / resolution">{job.capture.zoom} · {fmt(job.capture.gsd * 100, 0, ' cm/px')}</Row>
            <Row label="Image size">{job.capture.width.toLocaleString()} × {job.capture.height.toLocaleString()} px</Row>
          </div>
        </section>

        {/* Processed image from the backend */}
        {jobOnServer && overlayOk && (
          <section>
            <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" /> Processed image
            </h4>
            <a href={overlayUrl(job.jobId)} target="_blank" rel="noreferrer" className="block rounded-md border border-border overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={overlayUrl(job.jobId)} alt="Processed image with detected trees" className="w-full max-h-48 object-contain" onError={() => setOverlayOk(false)} />
            </a>
            <p className="mt-1 text-[11px] text-muted-foreground">As returned by the model, before review. Kept on the server for 72 hours.</p>
          </section>
        )}

        {/* Actions */}
        <section className="space-y-2 pt-1">
          <Button className="w-full" onClick={save} disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saved && !dirty ? 'Saved' : 'Save reviewed count'}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={download}>
              <Download className="h-4 w-4" /> GeoJSON
            </Button>
            <Button
              variant="ghost"
              className={cn('flex-1')}
              onClick={() => {
                if (dirty && !window.confirm('Discard the unsaved review and start a new count?')) return;
                onNewCount();
              }}
            >
              <RotateCcw className="h-4 w-4" /> New count
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
