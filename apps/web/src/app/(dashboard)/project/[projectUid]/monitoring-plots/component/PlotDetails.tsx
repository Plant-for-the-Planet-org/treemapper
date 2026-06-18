'use client';

import { Fragment, useState } from 'react';
import {
  ArrowLeft, Pencil, Trash2, MapPin, Layers, ChevronDown, ChevronRight, TreePine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import PlotMap from './PlotMap';

export type TimelineEntry = {
  uid: string;
  recordType: string;
  recordedAt: string | null;
  height: number | null;
  width: number | null;
  previousStatus: string | null;
  newStatus: string | null;
  image: string | null;
};

export type PlotPlant = {
  uid: string;
  hid: string;
  tag: string | null;
  speciesName: string | null;
  commonName: string | null;
  isUnknown: boolean | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
  height: number | null;
  width: number | null;
  plantingDate: string | null;
  lastMeasurementDate: string | null;
  remeasured: boolean | null;
  timeline: TimelineEntry[];
};

export type PlotDetail = {
  uid: string;
  hid: string;
  name: string | null;
  shape: string | null;
  plotType: string | null;
  complexity: string | null;
  radius: number | null;
  length: number | null;
  width: number | null;
  isComplete: boolean | null;
  captureMode: string | null;
  reviewStatus: string | null;
  totalTreeCount: number | null;
  geometry: any;
  center: any;
  metadata: any;
  createdAt: string | null;
  updatedAt: string | null;
  registrationDate: string | null;
  site: { uid: string; name: string } | null;
  group: { uid: string; name: string } | null;
  species: { uid: string; speciesName: string | null; commonName: string | null; speciesCount: number; isUnknown: boolean }[];
  observations: { uid: string; type: string; observedAt: string | null; unit: string | null; value: number | null }[];
  plants: PlotPlant[];
};

const fmtDate = (d?: string | null) => (d ? new Date(d).toISOString().split('T')[0] : '—');

const statusBadge = (status?: string | null) => {
  const s = (status || 'unknown').toLowerCase();
  const variant =
    s === 'alive' ? 'bg-green-100 text-green-800'
      : s === 'dead' ? 'bg-red-100 text-red-700'
        : s === 'sick' ? 'bg-amber-100 text-amber-800'
          : 'bg-gray-100 text-gray-700';
  return <span className={cn('px-1.5 py-0.5 rounded text-[11px] font-medium capitalize', variant)}>{s}</span>;
};

const dimensionLabel = (p: PlotDetail) => {
  if (p.shape === 'circle' && p.radius != null) return `Circle · r ${p.radius} m`;
  if (p.shape === 'rectangle' && p.length != null && p.width != null) return `Rectangle · ${p.length} × ${p.width} m`;
  if (p.shape) return p.shape;
  return '—';
};

const PlotDetails = ({
  plot,
  loading,
  onBack,
  onEdit,
  onDelete,
  canManage,
}: {
  plot: PlotDetail | null;
  loading: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canManage: boolean;
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (uid: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!plot) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button onClick={onBack} className="md:hidden inline-flex items-center text-xs text-muted-foreground mb-1">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold truncate">{plot.name || 'Unnamed plot'}</h1>
            {plot.isComplete
              ? <Badge variant="secondary" className="text-[10px]">Complete</Badge>
              : <Badge variant="outline" className="text-[10px]">Draft</Badge>}
            {plot.reviewStatus && (
              <Badge variant="outline" className="text-[10px] capitalize">{plot.reviewStatus.replace('_', ' ')}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
            <span className="font-mono">{plot.hid}</span>
            <span>·</span>
            <span>{plot.totalTreeCount ?? 0} trees</span>
            {plot.site && <><span>·</span><span className="inline-flex items-center"><MapPin className="w-3 h-3 mr-0.5" />{plot.site.name}</span></>}
            {plot.group && <><span>·</span><span className="inline-flex items-center"><Layers className="w-3 h-3 mr-0.5" />{plot.group.name}</span></>}
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="map" className="w-full">
        <TabsList>
          <TabsTrigger value="map">Map</TabsTrigger>
          <TabsTrigger value="plants">Plants ({plot.plants.length})</TabsTrigger>
          <TabsTrigger value="observations">Observations ({plot.observations.length})</TabsTrigger>
          <TabsTrigger value="species">Species ({plot.species.length})</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>

        {/* Map */}
        <TabsContent value="map">
          <div className="h-[420px]">
            {plot.geometry || plot.plants.length ? (
              <PlotMap geometry={plot.geometry} plants={plot.plants} height="420px" />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground border rounded-lg">
                No geometry recorded for this plot
              </div>
            )}
          </div>
        </TabsContent>

        {/* Plants */}
        <TabsContent value="plants">
          {plot.plants.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No plants recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Tag</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Height</TableHead>
                  <TableHead className="text-right">Width</TableHead>
                  <TableHead>Planted</TableHead>
                  <TableHead>Records</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plot.plants.map((pl) => (
                  <Fragment key={pl.uid}>
                    <TableRow className="cursor-pointer" onClick={() => toggle(pl.uid)}>
                      <TableCell>
                        {pl.timeline.length > 0
                          ? (expanded.has(pl.uid) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)
                          : null}
                      </TableCell>
                      <TableCell className="font-medium">{pl.tag || '—'}</TableCell>
                      <TableCell>
                        <span className={cn(pl.isUnknown && 'italic text-muted-foreground')}>
                          {pl.speciesName || 'Unknown'}
                        </span>
                        {pl.commonName && <span className="text-xs text-muted-foreground block">{pl.commonName}</span>}
                      </TableCell>
                      <TableCell>{statusBadge(pl.status)}</TableCell>
                      <TableCell className="text-right">{pl.height != null ? `${pl.height}` : '—'}</TableCell>
                      <TableCell className="text-right">{pl.width != null ? `${pl.width}` : '—'}</TableCell>
                      <TableCell className="text-xs">{fmtDate(pl.plantingDate)}</TableCell>
                      <TableCell className="text-xs">
                        {pl.timeline.length}
                        {pl.remeasured && <Badge variant="secondary" className="ml-1 text-[10px]">remeasured</Badge>}
                      </TableCell>
                    </TableRow>
                    {expanded.has(pl.uid) && pl.timeline.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/40 p-0">
                          <div className="p-3">
                            <p className="text-xs font-medium mb-2 inline-flex items-center">
                              <TreePine className="w-3.5 h-3.5 mr-1" /> Measurement timeline
                            </p>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead className="text-right">Height</TableHead>
                                  <TableHead className="text-right">Width</TableHead>
                                  <TableHead>Status change</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pl.timeline.map((t) => (
                                  <TableRow key={t.uid}>
                                    <TableCell className="text-xs">{fmtDate(t.recordedAt)}</TableCell>
                                    <TableCell className="text-xs capitalize">{t.recordType}</TableCell>
                                    <TableCell className="text-right text-xs">{t.height != null ? t.height : '—'}</TableCell>
                                    <TableCell className="text-right text-xs">{t.width != null ? t.width : '—'}</TableCell>
                                    <TableCell className="text-xs">
                                      {t.previousStatus && t.newStatus
                                        ? <span className="capitalize">{t.previousStatus} → {t.newStatus}</span>
                                        : '—'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* Observations */}
        <TabsContent value="observations">
          {plot.observations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No observations recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Observed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plot.observations.map((o) => (
                  <TableRow key={o.uid}>
                    <TableCell className="capitalize">{o.type.replace(/_/g, ' ')}</TableCell>
                    <TableCell className="text-right">{o.value != null ? o.value : '—'}</TableCell>
                    <TableCell>{o.unit || '—'}</TableCell>
                    <TableCell className="text-xs">{fmtDate(o.observedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* Species */}
        <TabsContent value="species">
          {plot.species.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No species recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Species</TableHead>
                  <TableHead>Common name</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plot.species.map((s) => (
                  <TableRow key={s.uid}>
                    <TableCell>
                      <span className={cn(s.isUnknown && 'italic text-muted-foreground')}>{s.speciesName || 'Unknown'}</span>
                      {s.isUnknown && <Badge variant="outline" className="ml-2 text-[10px]">unknown</Badge>}
                    </TableCell>
                    <TableCell>{s.commonName || '—'}</TableCell>
                    <TableCell className="text-right">{s.speciesCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* Info */}
        <TabsContent value="info">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm max-w-2xl">
            <Field label="Dimensions" value={dimensionLabel(plot)} />
            <Field label="Complexity" value={plot.complexity || '—'} />
            <Field label="Plot type" value={plot.plotType || '—'} />
            <Field label="Capture mode" value={plot.captureMode || '—'} />
            <Field label="Site" value={plot.site?.name || '—'} />
            <Field label="Group" value={plot.group?.name || '—'} />
            <Field label="Registered" value={fmtDate(plot.registrationDate)} />
            <Field label="Created" value={fmtDate(plot.createdAt)} />
            <Field label="Last updated" value={fmtDate(plot.updatedAt)} />
            <Field label="Review status" value={plot.reviewStatus ? plot.reviewStatus.replace('_', ' ') : '—'} />
          </dl>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="capitalize">{value}</dd>
  </div>
);

export default PlotDetails;
