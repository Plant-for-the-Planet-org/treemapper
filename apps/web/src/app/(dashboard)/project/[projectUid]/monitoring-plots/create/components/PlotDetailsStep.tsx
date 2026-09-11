'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileUp, Info, MapPin, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PlotDraft, PlotShape, SiteOption } from '../types';
import {
  buildBoundary, formatArea, polygonArea, polygonCenter, readSpatialFile, toBoundaryPolygon,
} from '../utils/plotGeometry';
import { downloadPlotTemplate } from '../utils/csvTemplates';
import { parsePlotDetails } from '../utils/parseCsv';
import PlotBoundaryMap from './PlotBoundaryMap';

/**
 * Step 1. The plot's own attributes plus its boundary.
 *
 * Two ways to get a boundary: place the centre on the map and type the exact
 * radius or side lengths (the shape is generated with the same turf maths the
 * mobile app uses), or upload a GeoJSON/KML polygon when a boundary already
 * exists. The two are mutually exclusive, which is why switching tabs clears the
 * other one's geometry rather than leaving a stale shape on the map.
 */

const parseNum = (v: string): number | null => {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const PlotDetailsStep = ({
  draft,
  onChange,
  sites,
  focusGeometry,
}: {
  draft: PlotDraft;
  onChange: (patch: Partial<PlotDraft>) => void;
  sites: SiteOption[];
  focusGeometry: any | null;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const plotCsvRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState('');
  const [csvNote, setCsvNote] = useState('');
  const [latText, setLatText] = useState(draft.center ? String(draft.center[1]) : '');
  const [lngText, setLngText] = useState(draft.center ? String(draft.center[0]) : '');
  const [coordError, setCoordError] = useState('');

  const area = polygonArea(draft.geometry);

  // Keep the text boxes in step when the centre changes elsewhere (a map click,
  // a dragged pin, or a filled plot sheet).
  useEffect(() => {
    setLatText(draft.center ? String(Number(draft.center[1].toFixed(6))) : '');
    setLngText(draft.center ? String(Number(draft.center[0].toFixed(6))) : '');
  }, [draft.center]);

  /** Regenerate the drawn boundary from the current centre and dimensions. */
  const regenerate = (patch: Partial<PlotDraft>) => {
    const next = { ...draft, ...patch };
    if (next.boundarySource === 'file') {
      onChange(patch);
      return;
    }
    const geometry = buildBoundary(next.shape, next.center, {
      radius: next.radius,
      length: next.length,
      width: next.width,
    });
    onChange({ ...patch, geometry });
  };

  /** Commit typed coordinates only once both are present and in range. */
  const commitCoords = (nextLat: string, nextLng: string) => {
    setLatText(nextLat);
    setLngText(nextLng);

    if (nextLat.trim() === '' && nextLng.trim() === '') {
      setCoordError('');
      return;
    }
    const lat = parseNum(nextLat);
    const lng = parseNum(nextLng);
    if (lat == null || lng == null) {
      setCoordError('');
      return;
    }
    if (lat < -90 || lat > 90) {
      setCoordError('Latitude must be between -90 and 90.');
      return;
    }
    if (lng < -180 || lng > 180) {
      setCoordError('Longitude must be between -180 and 180.');
      return;
    }
    setCoordError('');
    regenerate({ center: [lng, lat] });
  };

  const switchMode = (mode: string) => {
    if (mode === draft.boundarySource) return;
    if (mode === 'file') {
      onChange({ boundarySource: 'file', geometry: null, shape: 'polygon' });
    } else {
      setFileError('');
      onChange({
        boundarySource: 'map',
        geometry: null,
        uploadedFileName: null,
        shape: draft.shape === 'polygon' ? 'circle' : draft.shape,
      });
    }
  };

  const handleBoundaryFile = async (file: File) => {
    setFileError('');
    try {
      const parsed = await readSpatialFile(file);
      const polygon = toBoundaryPolygon(parsed);
      const center = polygonCenter(polygon);
      onChange({
        geometry: polygon,
        center,
        uploadedFileName: file.name,
        boundarySource: 'file',
        shape: 'polygon',
      });
    } catch (err: any) {
      setFileError(err?.message || 'Could not read that file.');
    }
  };

  const handlePlotCsv = async (file: File) => {
    setCsvNote('');
    try {
      const patch = await parsePlotDetails(file);
      const next = { ...draft, ...patch };
      const geometry = next.boundarySource === 'map'
        ? buildBoundary(next.shape, next.center, {
          radius: next.radius, length: next.length, width: next.width,
        })
        : next.geometry;
      onChange({ ...patch, geometry });
      const filled = Object.keys(patch).length;
      setCsvNote(filled ? `Filled ${filled} field${filled === 1 ? '' : 's'} from the sheet.` : 'Nothing in that sheet matched the plot fields.');
    } catch (err: any) {
      setCsvNote(err?.message || 'Could not read that file.');
    }
  };

  return (
    <div className="grid grid-cols-12 gap-5">
      {/* Attributes */}
      <div className="col-span-12 lg:col-span-5 space-y-4">
        <div className="border rounded-[3px] bg-card p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">Plot details</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px] text-muted-foreground"
              onClick={() => plotCsvRef.current?.click()}
            >
              <FileUp className="w-3 h-3 mr-1" /> Fill from sheet
            </Button>
            <input
              ref={plotCsvRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePlotCsv(f);
                e.target.value = '';
              }}
            />
          </div>

          {csvNote && <p className="text-[11.5px] text-muted-foreground">{csvNote}</p>}

          <div className="space-y-1.5">
            <Label htmlFor="plot-name">Name</Label>
            <Input
              id="plot-name"
              value={draft.name}
              placeholder="North ridge plot 1"
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Plot type</Label>
              <Select value={draft.plotType} onValueChange={(v) => onChange({ plotType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="intervention">Intervention</SelectItem>
                  <SelectItem value="control">Control</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plot-established">Established on</Label>
              <Input
                id="plot-established"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={draft.establishedOn.slice(0, 10)}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) onChange({ establishedOn: new Date(`${v}T00:00:00.000Z`).toISOString() });
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Site</Label>
            <Select
              value={draft.siteUid ?? 'none'}
              onValueChange={(v) => onChange({ siteUid: v === 'none' ? null : v })}
            >
              <SelectTrigger><SelectValue placeholder="No site" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No site</SelectItem>
                {sites.map((s) => (
                  <SelectItem key={s.uid} value={s.uid}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full h-8 text-[12px]"
            onClick={downloadPlotTemplate}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Download plot template
          </Button>
        </div>

        {/* Boundary controls */}
        <div className="border rounded-[3px] bg-card p-4 space-y-3.5">
          <h3 className="text-[13px] font-semibold">Boundary</h3>

          <Tabs value={draft.boundarySource} onValueChange={switchMode}>
            <TabsList className="w-full">
              <TabsTrigger value="map" className="flex-1 text-[12px]">Draw on map</TabsTrigger>
              <TabsTrigger value="file" className="flex-1 text-[12px]">Upload file</TabsTrigger>
            </TabsList>
          </Tabs>

          {draft.boundarySource === 'map' ? (
            <>
              <div className="space-y-1.5">
                <Label>Shape</Label>
                <Select
                  value={draft.shape}
                  onValueChange={(v) => regenerate({ shape: v as PlotShape })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="rectangle">Rectangle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {draft.shape === 'circle' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="plot-radius">Radius (m)</Label>
                  <Input
                    id="plot-radius"
                    type="number"
                    min={0}
                    step="any"
                    placeholder="10"
                    value={draft.radius ?? ''}
                    onChange={(e) => regenerate({ radius: parseNum(e.target.value) })}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="plot-length">Length (m)</Label>
                    <Input
                      id="plot-length"
                      type="number"
                      min={0}
                      step="any"
                      placeholder="20"
                      value={draft.length ?? ''}
                      onChange={(e) => regenerate({ length: parseNum(e.target.value) })}
                    />
                    <p className="text-[10.5px] text-muted-foreground">Runs north to south</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="plot-width">Width (m)</Label>
                    <Input
                      id="plot-width"
                      type="number"
                      min={0}
                      step="any"
                      placeholder="20"
                      value={draft.width ?? ''}
                      onChange={(e) => regenerate({ width: parseNum(e.target.value) })}
                    />
                    <p className="text-[10.5px] text-muted-foreground">Runs east to west</p>
                  </div>
                </div>
              )}

              {/* Typed coordinates are held as text until both halves are valid.
                  Committing on each keystroke would drop the first digit typed,
                  because one coordinate alone cannot form a centre. */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="plot-lat">Centre latitude</Label>
                  <Input
                    id="plot-lat"
                    type="number"
                    step="any"
                    placeholder="52.5200"
                    value={latText}
                    onChange={(e) => commitCoords(e.target.value, lngText)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plot-lng">Centre longitude</Label>
                  <Input
                    id="plot-lng"
                    type="number"
                    step="any"
                    placeholder="13.4050"
                    value={lngText}
                    onChange={(e) => commitCoords(latText, e.target.value)}
                  />
                </div>
              </div>
              {coordError && <p className="text-[11.5px] text-destructive">{coordError}</p>}
              {!draft.center && (
                <p className="text-[11.5px] text-muted-foreground inline-flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 mt-px flex-none" />
                  Click the map to set the centre, then drag the pin to adjust it.
                </p>
              )}
            </>
          ) : (
            <>
              <div
                className={cn(
                  'relative border-2 border-dashed rounded-lg p-5 text-center transition-colors',
                  draft.geometry ? 'border-[#007A49] bg-[#007A49]/5' : 'border-border hover:border-[#007A49]',
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleBoundaryFile(f);
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".geojson,.json,.kml"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleBoundaryFile(f);
                    e.target.value = '';
                  }}
                />
                {draft.uploadedFileName ? (
                  <div className="space-y-1">
                    <p className="text-[12.5px] font-medium">{draft.uploadedFileName}</p>
                    <p className="text-[11px] text-muted-foreground">Click to replace</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="text-[12.5px]">
                      <span className="font-medium text-[#007A49]">Choose a file</span> or drop it here
                    </p>
                    <p className="text-[11px] text-muted-foreground">GeoJSON or KML, one polygon</p>
                  </div>
                )}
              </div>
              {draft.uploadedFileName && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px] text-muted-foreground"
                  onClick={() => onChange({ geometry: null, uploadedFileName: null, center: null })}
                >
                  <X className="w-3 h-3 mr-1" /> Remove boundary
                </Button>
              )}
              {fileError && <p className="text-[11.5px] text-destructive">{fileError}</p>}
            </>
          )}

          {draft.geometry && (
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="secondary" className="text-[10.5px] font-normal">
                Area {formatArea(area)}
              </Badge>
              {draft.center && (
                <Badge variant="outline" className="text-[10.5px] font-normal font-mono">
                  <MapPin className="w-3 h-3 mr-1" />
                  {draft.center[1].toFixed(5)}, {draft.center[0].toFixed(5)}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="col-span-12 lg:col-span-7">
        <PlotBoundaryMap
          boundary={draft.geometry}
          center={draft.center}
          focusGeometry={focusGeometry}
          readOnly={draft.boundarySource === 'file'}
          onPickCenter={(c) => regenerate({ center: c })}
          height={520}
        />
        <p className="text-[11px] text-muted-foreground mt-2">
          {draft.boundarySource === 'file'
            ? 'The boundary comes from your file. Switch to "Draw on map" to place it by hand instead.'
            : 'The shape is generated from the centre and the exact size you type, matching how the mobile app records plots.'}
        </p>
      </div>
    </div>
  );
};

export default PlotDetailsStep;
