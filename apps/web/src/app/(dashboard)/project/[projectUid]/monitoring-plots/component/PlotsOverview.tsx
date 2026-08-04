'use client';

import { useMemo, useState } from 'react';
import { Search, Download, Layers, Plus, Grid2x2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { fmt, fmtDate } from './plotAnalytics';
import { Mono, Spark, Stat } from './PlotCharts';

export type PlotListItem = {
  uid: string;
  hid: string;
  name: string | null;
  shape: string | null;
  isComplete: boolean | null;
  reviewStatus: string | null;
  createdAt: string | null;
  // present when the list was fetched with stats=true
  totalTrees?: number;
  aliveTrees?: number;
  speciesCount?: number;
  lastMeasured?: string | null;
  radius?: number | null;
  length?: number | null;
  width?: number | null;
  areaSqm?: number | null;
  trend?: number[];
  // legacy lightweight field (kept for back-compat)
  totalTreeCount?: number | null;
};

export type PlotGroup = {
  uid: string;
  name: string;
  plots: { uid: string; hid: string; name: string | null }[];
};

const areaOf = (p: PlotListItem): number | null => {
  if (p.areaSqm && p.areaSqm > 0) return p.areaSqm;
  if (p.shape === 'circle' && p.radius != null) return Math.PI * p.radius * p.radius;
  if (p.shape === 'rectangle' && p.length != null && p.width != null) return p.length * p.width;
  return null;
};
const totalOf = (p: PlotListItem) => p.totalTrees ?? p.totalTreeCount ?? 0;
const survivalOf = (p: PlotListItem): number | null => {
  const total = totalOf(p);
  return total ? ((p.aliveTrees ?? 0) / total) * 100 : null;
};
const densityOf = (p: PlotListItem): number | null => {
  const area = areaOf(p);
  return area ? (p.aliveTrees ?? 0) / (area / 10000) : null;
};

const ShapeGlyph = ({ shape }: { shape: string | null }) => {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4 } as const;
  if (shape === 'rectangle') return <svg width="13" height="13" viewBox="0 0 14 14"><rect x="2" y="3" width="10" height="8" {...common} /></svg>;
  if (shape === 'polygon') return <svg width="13" height="13" viewBox="0 0 14 14"><path d="M7 2 L12 6 L10 12 L4 12 L2 6 Z" {...common} /></svg>;
  return <svg width="13" height="13" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" {...common} /></svg>;
};

const ReviewPill = ({ status }: { status: string | null }) => {
  const s = (status || '').toLowerCase();
  const map: Record<string, string> = {
    approved: 'bg-green-50 text-green-700 border-green-200',
    in_review: 'bg-blue-50 text-blue-700 border-blue-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  if (!s) return <span className="text-muted-foreground/50 text-[11px]">—</span>;
  return (
    <span className={cn('inline-flex items-center h-[20px] px-2 text-[11px] font-medium capitalize border rounded-[2px]', map[s] || 'bg-muted text-muted-foreground border-border')}>
      {s.replace('_', ' ')}
    </span>
  );
};

type SortKey = 'name' | 'survival' | 'stems';

const PlotsOverview = ({
  plots, groups, loading, onSelect, canManage, canCreate, onManageGroups, onCreatePlot,
}: {
  plots: PlotListItem[];
  groups: PlotGroup[];
  loading: boolean;
  onSelect: (p: PlotListItem) => void;
  /** Owners and admins: group management. */
  canManage: boolean;
  /** Owners, admins and contributors: creating a plot. */
  canCreate: boolean;
  onManageGroups: () => void;
  onCreatePlot: () => void;
}) => {
  const [q, setQ] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [sort, setSort] = useState<SortKey>('name');

  // plot uid -> group name (a plot is in at most one group)
  const groupByUid = useMemo(() => {
    const m = new Map<string, string>();
    groups.forEach((g) => g.plots.forEach((p) => m.set(p.uid, g.name)));
    return m;
  }, [groups]);

  const agg = useMemo(() => {
    const n = plots.length;
    const totalStems = plots.reduce((a, p) => a + totalOf(p), 0);
    const live = plots.reduce((a, p) => a + (p.aliveTrees ?? 0), 0);
    const survs = plots.map(survivalOf).filter((v): v is number => v != null);
    const dens = plots.map(densityOf).filter((v): v is number => v != null);
    const area = plots.reduce((a, p) => a + (areaOf(p) ?? 0), 0);
    return {
      n,
      totalStems,
      live,
      meanSurv: survs.length ? survs.reduce((a, b) => a + b, 0) / survs.length : null,
      meanDens: dens.length ? dens.reduce((a, b) => a + b, 0) / dens.length : null,
      area,
    };
  }, [plots]);

  const rows = useMemo(() => {
    const term = q.toLowerCase();
    let r = plots.filter((p) => {
      const matchSearch = !term || (p.name || '').toLowerCase().includes(term) || p.hid.toLowerCase().includes(term);
      const matchGroup =
        groupFilter === 'all' ? true
          : groupFilter === 'ungrouped' ? !groupByUid.has(p.uid)
            : groupByUid.get(p.uid) === groupFilter;
      return matchSearch && matchGroup;
    });
    r = [...r].sort((a, b) => {
      if (sort === 'survival') return (survivalOf(b) ?? -1) - (survivalOf(a) ?? -1);
      if (sort === 'stems') return totalOf(b) - totalOf(a);
      return (a.name || '').localeCompare(b.name || '');
    });
    return r;
  }, [plots, q, groupFilter, sort, groupByUid]);

  const kpis: { label: string; value: string; unit?: string; sub?: React.ReactNode; accent?: string }[] = [
    { label: 'Monitoring plots', value: fmt(agg.n), sub: `${groups.length} groups` },
    { label: 'Live stems', value: fmt(agg.live), unit: `/ ${fmt(agg.totalStems)}`, sub: 'tagged & tracked' },
    { label: 'Mean survival', value: agg.meanSurv != null ? fmt(agg.meanSurv, 1) : '—', unit: '%', accent: '#007A49', sub: 'plot-level mean' },
    { label: 'Mean stem density', value: agg.meanDens != null ? fmt(agg.meanDens, 0) : '—', unit: '/ ha', sub: 'live basis' },
    { label: 'Total sampled area', value: fmt(agg.area / 10000, 2), unit: 'ha', sub: `${fmt(agg.area, 0)} m²` },
  ];

  const groupNames = useMemo(() => groups.map((g) => g.name), [groups]);

  return (
    <div className="w-full max-w-[1280px] mx-auto px-1">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pt-1 pb-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">Monitoring Plots</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Permanent sample plots for measuring survival, growth, and biodiversity over time.</p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && <Button variant="outline" size="sm" onClick={onManageGroups}><Layers className="w-3.5 h-3.5 mr-1" /> Manage groups</Button>}
          <Button variant="outline" size="sm"><Download className="w-3.5 h-3.5 mr-1" /> Export</Button>
          {canCreate && <Button size="sm" onClick={onCreatePlot}><Plus className="w-3.5 h-3.5 mr-1" /> Create plot</Button>}
        </div>
      </div>

      {/* KPI strip */}
      <div className="border rounded-[3px] bg-card">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((k, i) => (
            <div key={k.label} className={cn('border-b', i < kpis.length - 1 && 'lg:border-r', i % 2 === 0 && 'border-r', 'sm:[&:nth-child(3n)]:border-r-0 lg:[&:nth-child(3n)]:border-r')}>
              <Stat {...k} />
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mt-5 mb-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search plots or ID" className="pl-8 h-8 text-sm w-[220px]" />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Chip active={groupFilter === 'all'} onClick={() => setGroupFilter('all')}>All groups</Chip>
          {groupNames.map((g) => (
            <Chip key={g} active={groupFilter === g} onClick={() => setGroupFilter(g)}>
              {g} <Mono className="opacity-60">{groups.find((x) => x.name === g)?.plots.length ?? 0}</Mono>
            </Chip>
          ))}
          {groupByUid.size < plots.length && <Chip active={groupFilter === 'ungrouped'} onClick={() => setGroupFilter('ungrouped')}>Ungrouped</Chip>}
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span>Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-8 px-2 text-[12.5px] bg-card border rounded-[2px] text-foreground/80 outline-none"
          >
            <option value="name">Name</option>
            <option value="survival">Survival</option>
            <option value="stems">Stem count</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-[3px] bg-card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Grid2x2 className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">{plots.length === 0 ? 'No plots yet' : 'No plots match this filter'}</p>
            {plots.length === 0 && canCreate && (
              <Button size="sm" className="mt-3" onClick={onCreatePlot}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Create your first plot
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plot</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="text-center">Shape</TableHead>
                <TableHead className="text-right">Live / total</TableHead>
                <TableHead className="w-[160px]">Survival</TableHead>
                <TableHead className="text-right">Stems / ha</TableHead>
                <TableHead className="text-right">Spp</TableHead>
                <TableHead className="text-center">Growth</TableHead>
                <TableHead>Last measured</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => {
                const surv = survivalOf(p);
                const dens = densityOf(p);
                return (
                  <TableRow key={p.uid} className="cursor-pointer" onClick={() => onSelect(p)}>
                    <TableCell>
                      <div className="font-medium text-foreground">{p.name || 'Unnamed plot'}</div>
                      <Mono className="text-[10.5px] text-muted-foreground/70">{p.hid}</Mono>
                    </TableCell>
                    <TableCell className="text-foreground/80 text-[12.5px]">{groupByUid.get(p.uid) || <span className="text-muted-foreground/50">—</span>}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                        <ShapeGlyph shape={p.shape} /><span className="capitalize text-[11.5px]">{p.shape || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Mono className="text-foreground">{p.aliveTrees ?? 0}</Mono>
                      <span className="text-muted-foreground/60"> / {totalOf(p)}</span>
                    </TableCell>
                    <TableCell>
                      {surv != null ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-[6px] bg-muted rounded-[2px] overflow-hidden">
                            <div className="h-full rounded-[2px]" style={{ width: `${surv}%`, background: surv > 80 ? '#007A49' : surv > 70 ? '#d97706' : '#dc2626' }} />
                          </div>
                          <Mono className="text-[11.5px] text-foreground/80 w-[34px] text-right">{fmt(surv, 0)}%</Mono>
                        </div>
                      ) : <span className="text-muted-foreground/50 text-[11px]">—</span>}
                    </TableCell>
                    <TableCell className="text-right"><Mono className="text-foreground/80">{dens != null ? fmt(dens, 0) : '—'}</Mono></TableCell>
                    <TableCell className="text-right"><Mono className="text-foreground/80">{p.speciesCount ?? '—'}</Mono></TableCell>
                    <TableCell><div className="flex justify-center"><Spark values={p.trend || []} /></div></TableCell>
                    <TableCell className="text-muted-foreground text-[12px]">{fmtDate(p.lastMeasured)}</TableCell>
                    <TableCell><div className="flex justify-end"><ReviewPill status={p.reviewStatus} /></div></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
      <div className="text-[11.5px] text-muted-foreground/70 mt-3">{rows.length} plot{rows.length === 1 ? '' : 's'} · click a row to open the plot record</div>
    </div>
  );
};

const Chip = ({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-1 h-8 px-2.5 text-[12px] font-medium rounded-[2px] border transition-colors',
      active ? 'bg-foreground text-background border-foreground' : 'bg-card text-foreground/80 border-border hover:bg-muted',
    )}
  >
    {children}
  </button>
);

export default PlotsOverview;
