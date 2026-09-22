'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, NavigationControl, Source } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AlertTriangle, CalendarClock, Camera, Info, Loader2, RotateCcw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ANALYSIS_API_URL, submitAnalysis } from '@/lib/satellite-count/api';
import {
  CANDIDATE_ZOOMS,
  CaptureResult,
  QUALITY_LABEL,
  captureImagery,
  recommendedZoom,
  zoomOptions,
} from '@/lib/satellite-count/capture';
import { imageryStyle, polygonFeature } from '@/lib/satellite-count/mapStyle';
import { BBox, PolygonGeometry, geometryBBox } from '@/lib/satellite-count/mercator';
import { PendingJob, savePendingJob } from '@/lib/satellite-count/review';
import {
  CURRENT_RELEASE,
  ImageryMetadata,
  ImageryRelease,
  getImageryMetadata,
  getImageryReleases,
  getMaxAvailableZoom,
} from '@/lib/satellite-count/wayback';

interface Props {
  interventionUid: string;
  polygon: PolygonGeometry;
}

const fmtM = (m: number) => (m < 1 ? `${Math.round(m * 100)} cm` : `${m.toFixed(1)} m`);

const qualityClass: Record<string, string> = {
  best: 'bg-primary/10 text-primary border-primary/20',
  good: 'bg-sky-50 text-sky-700 border-sky-200',
  usable: 'bg-amber-50 text-amber-700 border-amber-200',
  'too-coarse': 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function SatelliteCountCapture({ interventionUid, polygon }: Props) {
  const mapRef = useRef<MapRef>(null);
  const bbox = useMemo<BBox>(() => geometryBBox(polygon), [polygon]);
  const center = useMemo(() => [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2] as const, [bbox]);

  const [releases, setReleases] = useState<ImageryRelease[]>([]);
  const [release, setRelease] = useState<ImageryRelease | null>(null);
  const [releasesError, setReleasesError] = useState(false);
  // highest zoom Esri has imagery for at this site: undefined = checking, null = unknown
  const [maxZoom, setMaxZoom] = useState<number | null | undefined>(undefined);
  const options = useMemo(() => zoomOptions(bbox, maxZoom ?? null), [bbox, maxZoom]);
  const [zoom, setZoom] = useState(() => recommendedZoom(zoomOptions(bbox)));
  const [metadata, setMetadata] = useState<ImageryMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [minScore, setMinScore] = useState(0.3);

  const [capturing, setCapturing] = useState<{ done: number; total: number } | null>(null);
  const [capture, setCapture] = useState<(CaptureResult & { url: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Imagery releases (Wayback). Fall back to the live basemap if unavailable.
  useEffect(() => {
    let cancelled = false;
    getImageryReleases()
      .then(list => {
        if (cancelled) return;
        setReleases(list);
        setRelease(list[0] ?? CURRENT_RELEASE);
      })
      .catch(() => {
        if (cancelled) return;
        setReleasesError(true);
        setRelease(CURRENT_RELEASE);
      });
    return () => { cancelled = true; };
  }, []);

  // Which zoom levels actually have imagery here (varies by place and version).
  useEffect(() => {
    if (!release) return;
    let cancelled = false;
    setMaxZoom(undefined);
    getMaxAvailableZoom(release, center[0], center[1], CANDIDATE_ZOOMS)
      .then(z => {
        if (cancelled) return;
        setMaxZoom(z);
        setZoom(recommendedZoom(zoomOptions(bbox, z)));
      })
      .catch(() => { if (!cancelled) setMaxZoom(null); });
    return () => { cancelled = true; };
  }, [release, center, bbox]);

  // Capture date / provider / native resolution for the selected imagery.
  useEffect(() => {
    if (!release || maxZoom === undefined) return;
    let cancelled = false;
    setMetadataLoading(true);
    getImageryMetadata(release, center[0], center[1], zoom)
      .then(m => { if (!cancelled) setMetadata(m); })
      .catch(() => { if (!cancelled) setMetadata(null); })
      .finally(() => { if (!cancelled) setMetadataLoading(false); });
    return () => { cancelled = true; };
  }, [release, zoom, center, maxZoom]);

  // A new imagery date or zoom invalidates the captured image.
  useEffect(() => {
    setCapture(prev => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, [release, zoom]);
  useEffect(() => () => { if (capture) URL.revokeObjectURL(capture.url); }, [capture]);

  // never ask the map for zoom levels that don't exist here (they fail with CORS errors)
  const mapStyle = useMemo(
    () => (release && maxZoom !== undefined ? imageryStyle(release, maxZoom != null ? Math.min(zoom, maxZoom) : zoom) : null),
    [release, zoom, maxZoom],
  );
  const noImagery = maxZoom != null && maxZoom < CANDIDATE_ZOOMS[0];

  const fitToPolygon = () =>
    mapRef.current?.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 40, duration: 0, maxZoom: zoom });

  const selected = options.find(o => o.zoom === zoom) ?? options[0];
  const recommended = recommendedZoom(options);
  const aboveNative = metadata?.resolution != null && selected.gsd < metadata.resolution * 0.75;

  const doCapture = async () => {
    if (!release) return;
    setError(null);
    setCapturing({ done: 0, total: selected.tiles });
    try {
      const result = await captureImagery(release, bbox, zoom, (done, total) => setCapturing({ done, total }));
      setCapture({ ...result, url: URL.createObjectURL(result.blob) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not capture the imagery');
    } finally {
      setCapturing(null);
    }
  };

  const doSubmit = async () => {
    if (!capture || !release) return;
    setSubmitting(true);
    setError(null);
    try {
      const aoi = polygonFeature(polygon);
      const status = await submitAnalysis(capture.blob, aoi, {
        bounds: capture.window.bounds,
        min_score: minScore,
      });
      const job: PendingJob = {
        jobId: status.id,
        apiUrl: ANALYSIS_API_URL,
        submittedAt: new Date().toISOString(),
        minScore,
        capture: {
          releaseNum: release.releaseNum,
          releaseLabel: release.label,
          releaseUrlTemplate: release.urlTemplate,
          zoom,
          gsd: capture.gsd,
          bounds: capture.window.bounds,
          width: capture.window.width,
          height: capture.window.height,
          totalTiles: capture.totalTiles,
          missingTiles: capture.missingTiles,
          blankTiles: capture.blankTiles,
          imagery: metadata,
          capturedAt: new Date().toISOString(),
        },
      };
      savePendingJob(interventionUid, job); // parent switches to the processing view
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the analysis');
      setSubmitting(false);
    }
  };

  const polygonData = useMemo(() => polygonFeature(polygon), [polygon]);

  const captureRect = useMemo(() => {
    const [w, s, e, n] = capture?.window.bounds ?? bbox;
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'Polygon' as const, coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] },
    };
  }, [bbox, capture]);

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-0">
      {/* Map */}
      <div className="relative flex-1 min-h-[280px] bg-muted">
        {!mapStyle && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking available imagery…
          </div>
        )}
        {mapStyle && (
          <Map
            ref={mapRef}
            initialViewState={{ bounds: [[bbox[0], bbox[1]], [bbox[2], bbox[3]]], fitBoundsOptions: { padding: 40, maxZoom: zoom } }}
            mapStyle={mapStyle}
            style={{ width: '100%', height: '100%' }}
            attributionControl={{ compact: true }}
            maxZoom={22}
          >
            <NavigationControl position="bottom-right" showCompass={false} />
            <Source id="sc-capture" type="geojson" data={captureRect}>
              <Layer id="sc-capture-line" type="line" paint={{ 'line-color': '#ffffff', 'line-width': 1.5, 'line-dasharray': [3, 2], 'line-opacity': 0.9 }} />
            </Source>
            <Source id="sc-polygon" type="geojson" data={polygonData}>
              <Layer id="sc-polygon-line" type="line" paint={{ 'line-color': '#00E5FF', 'line-width': 2.5 }} />
            </Source>
          </Map>
        )}
        <div className="absolute top-3 left-3 max-w-xs rounded-md bg-background/90 px-3 py-2 text-xs shadow-sm backdrop-blur">
          <p className="font-medium text-foreground">This is exactly what will be analysed</p>
          <p className="text-muted-foreground mt-0.5">
            The image is captured automatically from the polygon boundary (dashed box) at the selected detail level.
            You can pan and zoom to inspect it; that doesn’t change the capture.
          </p>
        </div>
        <Button size="sm" variant="secondary" className="absolute top-3 right-3 shadow-sm" onClick={fitToPolygon}>
          Fit to polygon
        </Button>
      </div>

      {/* Controls */}
      <div className="w-full md:w-[340px] flex-shrink-0 border-t md:border-t-0 md:border-l border-border overflow-y-auto p-4 space-y-5">
        {/* Imagery date */}
        <section className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" /> Imagery version (Esri Wayback)
          </label>
          <select
            className="w-full h-9 rounded-md border border-border bg-background px-2 text-sm"
            value={release?.releaseNum ?? ''}
            disabled={!releases.length}
            onChange={e => setRelease(releases.find(r => r.releaseNum === +e.target.value) ?? null)}
          >
            {!releases.length && <option value="">{releasesError ? 'Current World Imagery' : 'Loading versions…'}</option>}
            {releases.map((r, i) => (
              <option key={r.releaseNum} value={r.releaseNum}>
                {r.label}{i === 0 ? ' (latest)' : ''}
              </option>
            ))}
          </select>
          <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground min-h-[2.5rem]">
            {metadataLoading ? (
              <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Looking up capture date…</span>
            ) : metadata ? (
              <>
                <div>Photo taken <span className="font-medium text-foreground">{metadata.date ?? 'unknown'}</span>{metadata.provider ? ` · ${metadata.provider}` : ''}</div>
                {metadata.resolution != null && <div>Native resolution {fmtM(metadata.resolution)}{metadata.source ? ` (${metadata.source})` : ''}</div>}
              </>
            ) : (
              <span>Capture date not available for this location.</span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Pick the newest version whose photo date is after the planting, so the trees are visible.
          </p>
        </section>

        {/* Zoom */}
        <section className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Detail level</label>
          <div className="space-y-1.5">
            {options.map(o => (
              <button
                key={o.zoom}
                type="button"
                disabled={o.tooLarge || o.unavailable || maxZoom === undefined}
                onClick={() => setZoom(o.zoom)}
                className={cn(
                  'w-full rounded-md border px-3 py-2 text-left text-xs transition-colors',
                  zoom === o.zoom ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:bg-muted/60',
                  (o.tooLarge || o.unavailable) && 'opacity-50 cursor-not-allowed',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">
                    Zoom {o.zoom} · {fmtM(o.gsd)} per pixel
                  </span>
                  {o.zoom === recommended && <Badge variant="outline" className="text-[10px] px-1.5">Recommended</Badge>}
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-muted-foreground">
                  <span>{o.unavailable ? 'No Esri imagery at this zoom here' : o.tooLarge ? 'Area too large at this zoom' : `${o.width.toLocaleString()} × ${o.height.toLocaleString()} px · ${o.tiles} tiles`}</span>
                  <span className={cn('rounded border px-1.5 py-px text-[10px]', qualityClass[o.quality])}>{QUALITY_LABEL[o.quality]}</span>
                </div>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground flex gap-1.5">
            <Info className="h-3.5 w-3.5 flex-shrink-0 mt-px" />
            Grown tree crowns (3 m+) are detected best at about 30 cm per pixel (zoom 19). Coarser levels miss small crowns.
          </p>
          {maxZoom != null && !noImagery && maxZoom < 19 && (
            <p className="text-[11px] text-amber-700 flex gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-px" />
              Esri’s imagery for this place only goes up to zoom {maxZoom} ({fmtM(options.find(o => o.zoom === maxZoom)?.gsd ?? 0)} per pixel).
              Small crowns may be missed. Another Wayback version may have sharper imagery.
            </p>
          )}
          {noImagery && (
            <p className="text-[11px] text-destructive flex gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-px" />
              This imagery version has no detailed imagery for this place. Try another version.
            </p>
          )}
          {aboveNative && (
            <p className="text-[11px] text-amber-700 flex gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-px" />
              This zoom is finer than the source photo ({fmtM(metadata!.resolution!)}), so it adds no real detail.
            </p>
          )}
        </section>

        {/* Advanced */}
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">Advanced</summary>
          <label className="mt-2 flex items-center justify-between gap-2">
            <span>Minimum confidence</span>
            <input
              type="number" min={0.05} max={0.95} step={0.05}
              value={minScore}
              onChange={e => setMinScore(Math.min(0.95, Math.max(0.05, +e.target.value || 0.3)))}
              className="w-20 h-8 rounded-md border border-border bg-background px-2 text-sm"
            />
          </label>
          <p className="mt-1 text-muted-foreground">Lower finds more trees but also more false positives, which you can remove during review.</p>
        </details>

        {/* Capture / preview / submit */}
        <section className="space-y-3">
          {capture && (
            <div className="space-y-2">
              <div className="rounded-md border border-border overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={capture.url} alt="Captured imagery" className="w-full max-h-56 object-contain" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {capture.window.width.toLocaleString()} × {capture.window.height.toLocaleString()} px · {(capture.blob.size / 1024 / 1024).toFixed(1)} MB
              </p>
              {(capture.missingTiles > 0 || capture.blankTiles > 0) && (
                <p className="text-[11px] text-amber-700 flex gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-px" />
                  {capture.missingTiles + capture.blankTiles} of {capture.totalTiles} tiles look empty. This imagery may not be available at this zoom; try zoom {Math.max(16, zoom - 1)}.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</div>
          )}

          {!capture ? (
            <Button
              className="w-full"
              onClick={doCapture}
              disabled={!release || !!capturing || selected.tooLarge || selected.unavailable || noImagery || maxZoom === undefined}
            >
              {capturing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Downloading imagery {capturing.done}/{capturing.total}</>
              ) : (
                <><Camera className="h-4 w-4" /> Capture imagery</>
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={doCapture} disabled={!!capturing || submitting}>
                <RotateCcw className="h-4 w-4" /> Recapture
              </Button>
              <Button className="flex-1" onClick={doSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Count trees
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
