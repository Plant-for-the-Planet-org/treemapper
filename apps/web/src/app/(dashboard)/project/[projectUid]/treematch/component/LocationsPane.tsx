'use client'

import {
  ArrowLeftRight, Info, List, Loader2, Map as MapIcon, Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { PlantingDateFilter } from './PlantingDateFilter';
import { InterventionMatchCard } from './InterventionMatchCard';
import { TreeMatchMap } from './TreeMatchMap';
import { fmtNum } from './types';
import type { LocationsPaneState } from './hooks/useTreematchLocations';

interface Props {
  locations: LocationsPaneState;
  /** the project the page is on, to mark it in the source-project picker */
  pageProjectUid: string;
  selected: Set<string>;
  isBlocked: (uid: string) => boolean;
  onToggle: (uid: string) => void;
  /** the selection already covers the chosen donations, so nothing more can be
   * added; blocked cards look broken without this said out loud */
  supplyCoversDemand: boolean;
}

export function LocationsPane({
  locations, pageProjectUid, selected, isBlocked, onToggle, supplyCoversDemand,
}: Props) {
  const {
    items, pagination, loading, loadingMore, error, notReadyCount, sites, generation,
    projectUid, projects, projectName, crossProject, changeProject,
    view, setView, mapFocus, setMapFocus, filters, reload, loadMore,
  } = locations;

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0 rounded-xl border border-border bg-background overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-3.5 pb-3 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-foreground">Plant locations</h2>
              <Badge variant="secondary" className="rounded-full px-2 text-[11px]">{fmtNum(pagination.total)}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Single &amp; multi-tree · synced &amp; complete</p>
          </div>
          <div className="flex items-center rounded-lg bg-muted p-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setView('list')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                view === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <List size={13} /> List
            </button>
            <button
              type="button"
              onClick={() => setView('map')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                view === 'map' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <MapIcon size={13} /> Map
            </button>
          </div>
        </div>
        {projects.length > 1 && (
          <div className="space-y-1">
            <Select value={projectUid} onValueChange={changeProject}>
              <SelectTrigger className="h-9 w-full text-xs rounded-lg">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.uid} value={p.uid}>
                    {p.name}{p.uid === pageProjectUid ? ' (this project)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {crossProject && (
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <ArrowLeftRight size={11} className="flex-shrink-0" />
                Cross-project: locations from {projectName ?? 'another project'}, matched to this project&apos;s donations.
              </p>
            )}
          </div>
        )}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={e => filters.setSearch(e.target.value)}
            placeholder="Search HID or site"
            className="h-9 pl-9 text-xs rounded-lg"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={filters.type} onValueChange={filters.setType}>
            <SelectTrigger className="flex-1 h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="single">Single-tree</SelectItem>
              <SelectItem value="multi">Multi-tree</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.site} onValueChange={filters.setSite}>
            <SelectTrigger className="flex-1 h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sites</SelectItem>
              {sites.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              <SelectItem value="none">Not linked to site</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <PlantingDateFilter value={filters.dates} onChange={filters.setDates} />
        <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
          <label className="flex items-center gap-1.5">
            <Checkbox checked={filters.onlyAvailable} onCheckedChange={v => filters.setOnlyAvailable(!!v)} />
            Only with available
          </label>
        </div>
      </div>
      {view === 'map' ? (
        <TreeMatchMap
          className="flex-1 min-h-0 m-3 mt-0"
          interventions={items}
          fitKey={generation}
          selected={selected}
          focusUid={mapFocus}
          onFocusChange={setMapFocus}
          onToggle={onToggle}
          isBlocked={isBlocked}
        />
      ) : (
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2.5">
          {/* Blocked cards look broken without a reason next to them. */}
          {supplyCoversDemand && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2">
              <Info size={13} className="flex-shrink-0 mt-0.5" />
              <span>
                These plant locations already cover the selected donations.
                Deselect one, or select another donation, to pick more.
              </span>
            </div>
          )}
          {notReadyCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2">
              <Info size={13} className="flex-shrink-0" />
              {notReadyCount} plant location(s) not shown (still syncing or capture incomplete).
            </div>
          )}
          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 space-y-1.5">
              <p>{error}</p>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={reload}>Retry</Button>
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 size={15} className="animate-spin" /> Loading plant locations…
            </div>
          )}
          {!loading && items.map(i => (
            <InterventionMatchCard
              key={i.uid}
              intervention={i}
              checked={selected.has(i.uid)}
              disabled={isBlocked(i.uid)}
              onToggle={onToggle}
              onViewMap={(uid) => { setMapFocus(uid); setView('map'); }}
            />
          ))}
          {!loading && !error && items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">No plant locations match these filters.</p>
          )}
          {!loading && pagination.page < pagination.totalPages && (
            <Button
              variant="outline" size="sm" className="w-full"
              disabled={loadingMore}
              onClick={loadMore}
            >
              {loadingMore
                ? <><Loader2 size={13} className="animate-spin" /> Loading…</>
                : `Load more (${fmtNum(items.length)} of ${fmtNum(pagination.total)})`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
