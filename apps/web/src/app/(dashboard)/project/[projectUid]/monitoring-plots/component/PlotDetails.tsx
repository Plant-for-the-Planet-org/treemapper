'use client';

import { Fragment, useMemo, useState } from 'react';
import {
  ArrowLeft, Pencil, Trash2, MapPin, Layers, ChevronDown, ChevronRight, Download, TreePine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import PlotMap from './PlotMap';
import {
  PlotDetail, PlotPlant, SPECIES_COLORS, STATUS_COLOR, cohortGrowth, fmt, fmtDate,
  observationSeries, plotMetrics, stemLayout,
} from './plotAnalytics';
import {
  Donut, GrowthChart, Label, MiniGrowth, Mono, ObservationChart, PlotDiagram, Ring, SectionTitle,
  StackBar, Stat, StatusDot,
} from './PlotCharts';

export type { PlotDetail, PlotPlant, TimelineEntry } from './plotAnalytics';

const dimensionLabel = (p: PlotDetail) => {
  if (p.shape === 'circle' && p.radius != null) return `Circle · r ${fmt(p.radius, 2)} m`;
  if (p.shape === 'rectangle' && p.length != null && p.width != null) return `Rectangle · ${fmt(p.length, 1)} × ${fmt(p.width, 1)} m`;
  if (p.shape) return p.shape;
  return '—';
};

const statusPill = (status?: string | null) => {
  const s = (status || 'unknown').toLowerCase();
  return (
    <span className="inline-flex items-center gap-1.5 capitalize text-[12.5px]">
      <StatusDot status={s} /> {s}
    </span>
  );
};

const reviewBadge = (status?: string | null) => {
  if (!status) return null;
  const s = status.toLowerCase();
  const cls =
    s === 'approved' ? 'bg-green-50 text-green-700 border-green-200'
      : s === 'rejected' ? 'bg-red-50 text-red-700 border-red-200'
        : s === 'in_review' ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-amber-50 text-amber-700 border-amber-200';
  return <Badge variant="outline" className={cn('text-[10px] capitalize', cls)}>{s.replace('_', ' ')}</Badge>;
};

const PlotDetails = ({
  plot, loading, onBack, onEdit, onDelete, canManage,
}: {
  plot: PlotDetail | null;
  loading: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canManage: boolean;
}) => {
  const m = useMemo(() => (plot ? plotMetrics(plot) : null), [plot]);
  const growth = useMemo(() => (plot ? cohortGrowth(plot) : []), [plot]);
  const layout = useMemo(() => (plot ? stemLayout(plot) : { stems: [], extent: 10 }), [plot]);
  const obsSeries = useMemo(() => (plot ? observationSeries(plot) : []), [plot]);
  const [view, setView] = useState<'schematic' | 'satellite'>('schematic');

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!plot || !m) return null;

  const survivalSeg = [
    { label: 'Alive', value: m.alive, color: STATUS_COLOR.alive },
    { label: 'Sick', value: m.sick, color: STATUS_COLOR.sick },
    { label: 'Removed', value: m.removed, color: STATUS_COLOR.removed },
    { label: 'Dead', value: m.dead, color: STATUS_COLOR.dead },
    { label: 'Unknown', value: m.unknown, color: STATUS_COLOR.unknown },
  ];
  const compData = plot.species.map((s, i) => ({
    label: s.speciesName || 'Unknown',
    value: s.speciesCount,
    color: SPECIES_COLORS[i % SPECIES_COLORS.length],
  }));

  const kpis: { label: string; value: string; unit?: string; sub?: React.ReactNode; accent?: string }[] = [
    { label: 'Live stems', value: fmt(m.alive), unit: `/ ${fmt(m.total)}`, sub: 'recorded' },
    {
      label: 'Survival rate',
      value: m.survival != null ? fmt(m.survival, 1) : '—',
      unit: '%',
      accent: m.survival != null && m.survival >= 80 ? '#007A49' : '#d97706',
      sub: `${m.dead} dead · ${m.sick} sick`,
    },
    { label: 'Stem density', value: m.density != null ? fmt(m.density, 0) : '—', unit: '/ ha', sub: 'live basis' },
    { label: 'Species richness', value: fmt(m.richness), unit: 'spp', sub: <>H&prime; {fmt(m.shannon, 2)} · J&prime; {fmt(m.evenness, 2)}</> },
    { label: 'Plot area', value: m.area != null ? fmt(m.area, 0) : '—', unit: 'm²', sub: m.area != null ? `${fmt(m.area / 10000, 3)} ha` : 'unknown extent' },
    { label: 'Mean height', value: m.meanHeight != null ? fmt(m.meanHeight, 1) : '—', unit: 'm', sub: m.meanWidth != null ? `⌀ width ${fmt(m.meanWidth, 1)} m` : '—' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <button onClick={onBack} className="md:hidden inline-flex items-center text-xs text-muted-foreground mb-2">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to plots
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[22px] font-semibold tracking-tight leading-tight truncate">{plot.name || 'Unnamed plot'}</h1>
              {plot.isComplete
                ? <Badge variant="secondary" className="text-[10px]">Complete</Badge>
                : <Badge variant="outline" className="text-[10px]">Draft</Badge>}
              {reviewBadge(plot.reviewStatus)}
            </div>
            <div className="flex items-center gap-2.5 mt-2 text-xs text-muted-foreground flex-wrap">
              <Mono className="text-foreground/70">{plot.hid}</Mono>
              <Sep />
              <span className="capitalize">{[plot.shape, plot.plotType].filter(Boolean).join(' · ') || '—'}</span>
              {plot.site && <><Sep /><span className="inline-flex items-center"><MapPin className="w-3 h-3 mr-1" />{plot.site.name}</span></>}
              {plot.group && <><Sep /><span className="inline-flex items-center"><Layers className="w-3 h-3 mr-1" />{plot.group.name}</span></>}
              <Sep /><span>Registered {fmtDate(plot.registrationDate)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm"><Download className="w-3.5 h-3.5 mr-1" /> Export</Button>
            {canManage && (
              <>
                <Button variant="outline" size="sm" onClick={onEdit}><Pencil className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="border rounded-[3px] bg-card">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {kpis.map((c, i) => (
            <div key={c.label} className={cn('border-b', i < kpis.length - 1 && 'lg:border-r', i % 2 === 0 && 'border-r', '[&:nth-child(odd)]:sm:border-r')}>
              <Stat {...c} />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trees">Trees ({plot.plants.length})</TabsTrigger>
          <TabsTrigger value="observations">Observations ({plot.observations.length})</TabsTrigger>
          <TabsTrigger value="species">Species ({plot.species.length})</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>

        {/* ---------------- Overview ---------------- */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-12 gap-4">
            {/* Spatial */}
            <div className="col-span-12 lg:col-span-5 border rounded-[3px] bg-card">
              <SectionTitle
                right={(
                  <div className="flex gap-1">
                    <ToggleBtn active={view === 'schematic'} onClick={() => setView('schematic')}>Schematic</ToggleBtn>
                    <ToggleBtn active={view === 'satellite'} onClick={() => setView('satellite')}>Satellite</ToggleBtn>
                  </div>
                )}
              >
                Stem map
              </SectionTitle>
              <div className="p-3">
                {view === 'schematic'
                  ? <PlotDiagramWrap plot={plot} layout={layout} />
                  : (
                    <div className="h-[340px]">
                      {plot.geometry || layout.stems.length
                        ? <PlotMap geometry={plot.geometry} plants={plot.plants} height="340px" />
                        : <div className="h-full flex items-center justify-center text-sm text-muted-foreground border rounded-lg">No geometry recorded</div>}
                    </div>
                  )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 px-1">
                  {['alive', 'sick', 'removed', 'dead'].map((s) => (
                    <span key={s} className="flex items-center gap-1.5 text-[11px] capitalize text-foreground/80">
                      <StatusDot status={s} /> {s} <Mono className="text-muted-foreground">{plot.plants.filter((x) => (x.status || 'unknown').toLowerCase() === s).length}</Mono>
                    </span>
                  ))}
                  <span className="ml-auto text-[10.5px] text-muted-foreground/70">dot size ∝ crown width</span>
                </div>
              </div>
            </div>

            {/* Analysis cards */}
            <div className="col-span-12 lg:col-span-7 grid grid-cols-2 gap-4 content-start">
              <div className="col-span-2 sm:col-span-1 border rounded-[3px] bg-card">
                <SectionTitle>Survivorship</SectionTitle>
                <div className="flex items-center gap-4 p-4">
                  <Ring value={m.survival ?? 0} label="survival" />
                  <div className="flex-1">
                    <div className="space-y-2">
                      {survivalSeg.filter((s) => s.value > 0).map((s) => (
                        <div key={s.label} className="flex items-center justify-between text-[12px]">
                          <span className="flex items-center gap-1.5 text-foreground/80">
                            <span className="inline-block w-2 h-2 rounded-[2px]" style={{ background: s.color }} />{s.label}
                          </span>
                          <Mono>{s.value}</Mono>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3"><StackBar segments={survivalSeg} /></div>
                  </div>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 border rounded-[3px] bg-card">
                <SectionTitle>Composition</SectionTitle>
                <div className="flex items-center gap-4 p-4">
                  {compData.length ? <Donut data={compData} /> : <div className="text-sm text-muted-foreground">No species</div>}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    {compData.map((s) => (
                      <div key={s.label} className="flex items-center justify-between text-[11.5px]">
                        <span className="flex items-center gap-1.5 truncate text-foreground/80">
                          <span className="inline-block w-2 h-2 rounded-[2px] flex-none" style={{ background: s.color }} />
                          <span className="italic truncate">{s.label}</span>
                        </span>
                        <Mono>{Math.round((s.value / (m.total || 1)) * 100)}%</Mono>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-span-2 border rounded-[3px] bg-card">
                <SectionTitle right={<span className="flex items-center gap-1.5 text-[11px] text-foreground/70"><span className="inline-block w-2.5 h-0.5 bg-[#007A49]" /> Mean height (m)</span>}>
                  Cohort growth
                </SectionTitle>
                <div className="p-3"><GrowthChart data={growth} /></div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ---------------- Trees ---------------- */}
        <TabsContent value="trees" className="mt-4">
          <TreesTable plants={plot.plants} />
        </TabsContent>

        {/* ---------------- Observations ---------------- */}
        <TabsContent value="observations" className="mt-4">
          {obsSeries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No observations recorded for this plot.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {obsSeries.map((s, i) => {
                const color = ['#2563eb', '#d97706', '#007A49', '#9333ea'][i % 4];
                return (
                  <div key={s.type} className="border rounded-[3px] bg-card">
                    <SectionTitle right={<Mono className="text-[12px]">{s.last != null ? fmt(s.last, 1) : '—'} {s.unit || ''}</Mono>}>
                      <span className="capitalize">{s.label}</span>
                    </SectionTitle>
                    <div className="px-3 pt-3">
                      <div className="flex items-baseline gap-2 mb-1 px-1 text-[11px] text-muted-foreground">
                        <span>{s.points.length} readings</span>
                        {s.delta != null && (
                          <span style={{ color: s.delta >= 0 ? STATUS_COLOR.alive : STATUS_COLOR.dead }}>
                            {s.delta >= 0 ? '▲' : '▼'} {Math.abs(s.delta)}%
                          </span>
                        )}
                      </div>
                      <ObservationChart series={s} color={color} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ---------------- Species ---------------- */}
        <TabsContent value="species" className="mt-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-8 border rounded-[3px] bg-card overflow-hidden">
              <SectionTitle>Species abundance & survival</SectionTitle>
              <SpeciesTable plot={plot} total={m.total} />
            </div>
            <div className="col-span-12 lg:col-span-4 border rounded-[3px] bg-card">
              <SectionTitle>Diversity indices</SectionTitle>
              <div className="p-4 space-y-1">
                <IndexRow label="Species richness (S)" value={fmt(m.richness)} note="observed taxa" />
                <IndexRow label="Shannon index (H′)" value={fmt(m.shannon, 2)} note="abundance-weighted" />
                <IndexRow label="Pielou evenness (J′)" value={fmt(m.evenness, 2)} note="0–1, higher = even" />
                <IndexRow label="Stems / hectare" value={m.density != null ? fmt(m.density, 0) : '—'} note="live basis" last />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ---------------- Info ---------------- */}
        <TabsContent value="info" className="mt-4">
          <div className="border rounded-[3px] bg-card overflow-hidden">
            <SectionTitle>Plot metadata</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {([
                ['Plot UID', plot.uid],
                ['Human ID', plot.hid],
                ['Dimensions', dimensionLabel(plot)],
                ['Complexity', plot.complexity || '—'],
                ['Plot type', plot.plotType || '—'],
                ['Capture mode', plot.captureMode || '—'],
                ['Site', plot.site?.name || '—'],
                ['Group', plot.group?.name || '—'],
                ['Registered', fmtDate(plot.registrationDate)],
                ['Created', fmtDate(plot.createdAt)],
                ['Last updated', fmtDate(plot.updatedAt)],
                ['Review status', plot.reviewStatus ? plot.reviewStatus.replace('_', ' ') : '—'],
              ] as [string, string][]).map((f) => (
                <div key={f[0]} className="px-4 py-3 border-b border-r">
                  <Label>{f[0]}</Label>
                  <div className="mt-1 text-[12.5px] capitalize"><Mono>{f[1]}</Mono></div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Sep = () => <span className="text-muted-foreground/50">·</span>;

const ToggleBtn = ({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      'h-6 px-2 text-[11px] font-medium rounded-[2px] border transition-colors',
      active ? 'bg-foreground text-background border-foreground' : 'bg-card text-muted-foreground border-border hover:bg-muted',
    )}
  >
    {children}
  </button>
);

const PlotDiagramWrap = ({ plot, layout }: { plot: PlotDetail; layout: ReturnType<typeof stemLayout> }) => {
  if (layout.stems.length === 0 && !plot.radius) {
    return <div className="h-[340px] flex items-center justify-center text-sm text-muted-foreground border rounded-lg">No stem coordinates to plot</div>;
  }
  return <PlotDiagram shape={plot.shape} extent={layout.extent} radius={plot.radius} stems={layout.stems} />;
};

const IndexRow = ({ label, value, note, last }: { label: string; value: string; note: string; last?: boolean }) => (
  <div className={cn('flex items-center justify-between py-3', !last && 'border-b')}>
    <div>
      <div className="text-[12.5px] text-foreground/80">{label}</div>
      <div className="text-[10.5px] text-muted-foreground/70">{note}</div>
    </div>
    <Mono className="text-[20px] font-semibold">{value}</Mono>
  </div>
);

/* ----------------------------------------------------- Trees table */

const TreesTable = ({ plants }: { plants: PlotPlant[] }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<'tag' | 'height' | 'width'>('tag');

  const rows = useMemo(() => {
    const r = [...plants];
    r.sort((a, b) => {
      if (sortKey === 'height') return (b.height ?? -1) - (a.height ?? -1);
      if (sortKey === 'width') return (b.width ?? -1) - (a.width ?? -1);
      return (a.tag || '').localeCompare(b.tag || '');
    });
    return r;
  }, [plants, sortKey]);

  const toggle = (uid: string) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(uid)) next.delete(uid); else next.add(uid);
    return next;
  });

  if (plants.length === 0) return <p className="text-sm text-muted-foreground py-10 text-center">No trees recorded in this plot.</p>;

  return (
    <div className="border rounded-[3px] bg-card overflow-hidden">
      <SectionTitle right={<span className="text-[11px] text-muted-foreground/70">click a row for growth history</span>}>
        Tagged trees · {plants.length}
      </SectionTitle>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Tag</TableHead>
            <TableHead>Species</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right cursor-pointer select-none" onClick={() => setSortKey('height')}>Height (m){sortKey === 'height' ? ' ↓' : ''}</TableHead>
            <TableHead className="text-right cursor-pointer select-none" onClick={() => setSortKey('width')}>Width (m){sortKey === 'width' ? ' ↓' : ''}</TableHead>
            <TableHead className="text-right">Records</TableHead>
            <TableHead>Last measured</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((pl) => (
            <Fragment key={pl.uid}>
              <TableRow className="cursor-pointer" onClick={() => toggle(pl.uid)}>
                <TableCell>
                  {pl.timeline.length > 0
                    ? (expanded.has(pl.uid) ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />)
                    : null}
                </TableCell>
                <TableCell><Mono className="font-medium">{pl.tag || '—'}</Mono></TableCell>
                <TableCell>
                  <span className={cn('italic', pl.isUnknown && 'text-muted-foreground')}>{pl.speciesName || 'Unknown'}</span>
                  {pl.commonName && <span className="text-[10.5px] text-muted-foreground block">{pl.commonName}</span>}
                </TableCell>
                <TableCell>{statusPill(pl.status)}</TableCell>
                <TableCell className="text-right"><Mono>{pl.height != null ? fmt(pl.height, 2) : '—'}</Mono></TableCell>
                <TableCell className="text-right"><Mono>{pl.width != null ? fmt(pl.width, 2) : '—'}</Mono></TableCell>
                <TableCell className="text-right">
                  <Mono className="text-muted-foreground">{pl.timeline.length}</Mono>
                  {pl.remeasured && <Badge variant="secondary" className="ml-1.5 text-[10px]">remeasured</Badge>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{fmtDate(pl.lastMeasurementDate || pl.plantingDate)}</TableCell>
              </TableRow>
              {expanded.has(pl.uid) && pl.timeline.length > 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="bg-muted/40 p-0">
                    <div className="p-4 grid grid-cols-12 gap-5">
                      <div className="col-span-12 md:col-span-5">
                        <Label className="mb-2 inline-flex items-center"><TreePine className="w-3.5 h-3.5 mr-1" /> Height trajectory</Label>
                        <div className="border rounded-[3px] bg-card p-2">
                          <MiniGrowth data={pl.timeline.map((t) => ({ label: t.recordedAt ? new Date(t.recordedAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : '', value: t.height }))} />
                        </div>
                      </div>
                      <div className="col-span-12 md:col-span-7">
                        <Label className="mb-2">Measurement records</Label>
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
                                <TableCell className="text-xs"><Mono>{fmtDate(t.recordedAt)}</Mono></TableCell>
                                <TableCell className="text-xs capitalize text-muted-foreground">{t.recordType}</TableCell>
                                <TableCell className="text-right text-xs"><Mono>{t.height != null ? fmt(t.height, 2) : '—'}</Mono></TableCell>
                                <TableCell className="text-right text-xs"><Mono>{t.width != null ? fmt(t.width, 2) : '—'}</Mono></TableCell>
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
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

/* ----------------------------------------------------- Species table */

const SpeciesTable = ({ plot, total }: { plot: PlotDetail; total: number }) => {
  const max = Math.max(1, ...plot.species.map((s) => s.speciesCount));
  // alive count per species, derived from plants
  const aliveByName = useMemo(() => {
    const map = new Map<string, number>();
    plot.plants.forEach((t) => {
      if ((t.status || '').toLowerCase() === 'alive' && t.speciesName) {
        map.set(t.speciesName, (map.get(t.speciesName) || 0) + 1);
      }
    });
    return map;
  }, [plot]);

  if (plot.species.length === 0) return <p className="text-sm text-muted-foreground py-10 text-center">No species recorded.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Species</TableHead>
          <TableHead>Relative abundance</TableHead>
          <TableHead className="text-right">Stems</TableHead>
          <TableHead className="text-right">Survival</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plot.species.map((s, i) => {
          const color = SPECIES_COLORS[i % SPECIES_COLORS.length];
          const alive = s.speciesName ? aliveByName.get(s.speciesName) || 0 : 0;
          const surv = s.speciesCount ? Math.round((alive / s.speciesCount) * 100) : 0;
          return (
            <TableRow key={s.uid}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-[2px] flex-none" style={{ background: color }} />
                  <div>
                    <span className={cn('italic', s.isUnknown && 'text-muted-foreground')}>{s.speciesName || 'Unknown'}</span>
                    {s.commonName && <div className="text-[10.5px] text-muted-foreground">{s.commonName}</div>}
                  </div>
                </div>
              </TableCell>
              <TableCell style={{ width: '34%' }}>
                <div className="flex items-center gap-2">
                  <div className="h-[7px] rounded-[2px] min-w-[6px]" style={{ width: `${(s.speciesCount / max) * 100}%`, background: color }} />
                  <Mono className="text-[11px] text-muted-foreground">{Math.round((s.speciesCount / (total || 1)) * 100)}%</Mono>
                </div>
              </TableCell>
              <TableCell className="text-right"><Mono>{s.speciesCount}</Mono></TableCell>
              <TableCell className="text-right"><Mono style={{ color: surv >= 80 ? '#007A49' : '#d97706' }}>{surv}%</Mono></TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default PlotDetails;
