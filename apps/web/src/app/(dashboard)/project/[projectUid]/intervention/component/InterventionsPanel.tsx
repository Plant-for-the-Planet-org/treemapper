'use client'

import React from 'react'
// Leaf icon unused while bulk species edit is hidden
import { Search, ArrowUp, ArrowDown, CheckSquare, X, Trees, Loader, ListFilter, Flag, FlagOff, MapPin, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { InterventionCard } from './InterventionCard'

interface Site {
  id: string | number
  name: string
}

interface Filters {
  type: string
  captureMode: string
  projectSiteId: string
  flag: string
  sortOrder: string
  [key: string]: unknown
}

interface Props {
  interventions: any[]
  selectedIntervention: any
  onSelect: (i: any) => void
  loading: boolean
  error: string | null
  searchTerm: string
  setSearchTerm: (v: string) => void
  filters: Filters
  setFilters: React.Dispatch<React.SetStateAction<any>>
  interventionTypes: string[]
  sites: Site[]
  pagination: { total: number }
  activeFilterCount: number
  clearAllFilters: () => void
  hasMore: boolean
  observerRef: React.RefObject<HTMLDivElement>
  fetchInterventionData: () => void
  onCreate: () => void
  // bulk
  isBulkMode: boolean
  selectedUids: Set<string>
  onToggleSelect: (uid: string, shiftKey?: boolean) => void
  onEnterBulkMode: () => void
  onExitBulkMode: () => void
  onSelectAll: () => void
  onClearSelection: () => void
  onOpenBulkUpdate: () => void
  onOpenBulkSpeciesEdit: () => void
  onOpenBulkStartDateEdit: () => void
  lockedType: string | null
}

const labelize = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

const CAPTURE_MODES = [
  { value: 'on-site', label: 'On Site' },
  { value: 'off-site', label: 'Off Site' },
  { value: 'external', label: 'External' },
  { value: 'unknown', label: 'Unknown' },
]

export const InterventionsPanel = ({
  interventions, selectedIntervention, onSelect, loading, error,
  searchTerm, setSearchTerm, filters, setFilters, interventionTypes, sites,
  pagination, activeFilterCount, clearAllFilters, hasMore, observerRef, fetchInterventionData, onCreate,
  isBulkMode, selectedUids, onToggleSelect, onEnterBulkMode, onExitBulkMode,
  onSelectAll, onClearSelection,
  // onOpenBulkSpeciesEdit not destructured while bulk species edit is hidden
  onOpenBulkUpdate, onOpenBulkStartDateEdit, lockedType,
}: Props) => {
  const [filterOpen, setFilterOpen] = React.useState(false)
  const listRef = React.useRef<HTMLDivElement>(null)

  // Keep the keyboard-selected card visible as the user arrows through.
  React.useEffect(() => {
    if (isBulkMode || !selectedIntervention) return
    const el = listRef.current?.querySelector(`[data-uid="${selectedIntervention.uid}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIntervention?.uid, isBulkMode])

  const setFilter = (key: string, value: string) =>
    setFilters((prev: any) => ({ ...prev, [key]: value === 'all' ? '' : value }))

  const toggleSort = () =>
    setFilters((prev: any) => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))

  // Flag is an independent toggle (sits next to sort) that cycles:
  // all -> flagged only -> not flagged -> all.
  const FLAG_CYCLE = ['all', 'true', 'false']
  const cycleFlag = () => {
    const cur = filters.flag || 'all'
    setFilter('flag', FLAG_CYCLE[(FLAG_CYCLE.indexOf(cur) + 1) % FLAG_CYCLE.length])
  }
  const flagTitle = filters.flag === 'true' ? 'Showing flagged only'
    : filters.flag === 'false' ? 'Showing not flagged'
    : 'Flag: all'

  const siteName = (id: string) => sites.find((s) => String(s.id) === id)?.name ?? id

  // Active popover filters shown as removable chips under the search bar.
  // Flag is excluded: it has its own independent toggle next to sort.
  const activeChips = [
    filters.type && { key: 'type', label: `Type: ${labelize(filters.type)}` },
    filters.projectSiteId && { key: 'projectSiteId', label: `Site: ${siteName(filters.projectSiteId)}` },
    filters.captureMode && { key: 'captureMode', label: `Mode: ${CAPTURE_MODES.find((m) => m.value === filters.captureMode)?.label ?? filters.captureMode}` },
  ].filter(Boolean) as { key: string; label: string }[]

  const total = Number(pagination.total) || interventions.length

  // Bulk select: items eligible to (de)select together share one type.
  const eligibleType = lockedType ?? interventions[0]?.type
  const eligibleUids = interventions.filter((i) => i.type === eligibleType).map((i) => i.uid)
  const allEligibleSelected = eligibleUids.length > 0 && eligibleUids.every((uid) => selectedUids.has(uid))

  return (
    <div className="w-full h-full flex flex-col bg-background border-r border-border/50">
      {/* Filters */}
      <div className="p-3 space-y-2 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={14} />
            <Input
              placeholder="Search by HID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-normal">
                <ListFilter size={14} />
                Filter
                {activeChips.length > 0 && (
                  <Badge className="h-4 min-w-4 px-1 text-[10px] tabular-nums">{activeChips.length}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <Select value={filters.type || 'all'} onValueChange={(v) => setFilter('type', v)}>
                  <SelectTrigger size="sm" className="h-8 text-xs w-full"><SelectValue placeholder="All Types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Types</SelectItem>
                    {interventionTypes.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">{labelize(t)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Site</label>
                <Select value={filters.projectSiteId || 'all'} onValueChange={(v) => setFilter('projectSiteId', v)}>
                  <SelectTrigger size="sm" className="h-8 text-xs w-full"><SelectValue placeholder="All Sites" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Sites</SelectItem>
                    {sites.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)} className="text-xs">{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Capture mode</label>
                <Select value={filters.captureMode || 'all'} onValueChange={(v) => setFilter('captureMode', v)}>
                  <SelectTrigger size="sm" className="h-8 text-xs w-full"><SelectValue placeholder="All Capture Modes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Capture Modes</SelectItem>
                    {CAPTURE_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeChips.length > 0 && (
                <Button variant="ghost" size="sm" className="h-7 w-full text-xs text-muted-foreground" onClick={clearAllFilters}>
                  Clear all filters
                </Button>
              )}
            </PopoverContent>
          </Popover>

          <button
            onClick={cycleFlag}
            title={flagTitle}
            aria-label={flagTitle}
            className={cn(
              'flex items-center justify-center h-8 w-8 rounded-md border transition-colors flex-shrink-0',
              filters.flag
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
            )}
          >
            {filters.flag === 'false' ? <FlagOff size={14} /> : <Flag size={14} />}
          </button>

          <button
            onClick={toggleSort}
            title="Sort by date"
            className="flex items-center justify-center h-8 w-8 rounded-md border border-border bg-background text-muted-foreground hover:bg-muted/50 transition-colors flex-shrink-0"
          >
            {filters.sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          </button>
        </div>

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => setFilter(chip.key, 'all')}
                className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground/80 hover:bg-muted/70 transition-colors"
              >
                {chip.label}
                <X size={11} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
          <span>{total.toLocaleString('en-US')} intervention{total !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="text-primary hover:underline">
                Clear filters
              </button>
            )}
            {!isBulkMode && interventions.length > 0 && (
              <button
                onClick={onEnterBulkMode}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                <CheckSquare size={13} />
                Select
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {isBulkMode && (
        <div className="px-3 py-2 bg-primary text-primary-foreground flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs min-w-0">
            <span className="font-medium whitespace-nowrap">{selectedUids.size} selected</span>
            <button
              onClick={allEligibleSelected ? onClearSelection : onSelectAll}
              className="text-primary-foreground/80 hover:text-primary-foreground underline-offset-2 hover:underline whitespace-nowrap"
            >
              {allEligibleSelected ? 'Clear' : 'Select all'}
            </button>
          </div>
          <div className="flex items-center gap-0.5">
            {[
              { title: 'Assign site', icon: MapPin, onClick: onOpenBulkUpdate },
              // Bulk species edit hidden for now
              // { title: 'Edit species', icon: Leaf, onClick: onOpenBulkSpeciesEdit },
              { title: 'Edit date', icon: Calendar, onClick: onOpenBulkStartDateEdit },
            ].map(({ title, icon: Icon, onClick }) => (
              <button
                key={title}
                title={title}
                aria-label={title}
                disabled={selectedUids.size === 0}
                onClick={onClick}
                className="flex items-center justify-center h-7 w-7 rounded hover:bg-primary-foreground/15 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <Icon size={14} />
              </button>
            ))}
            <span className="mx-0.5 h-4 w-px bg-primary-foreground/25" />
            <button onClick={onExitBulkMode} title="Exit selection" aria-label="Exit selection" className="flex items-center justify-center h-7 w-7 rounded hover:bg-primary-foreground/15 transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <ScrollArea className="flex-1 min-h-0">
        {interventions.length === 0 && !loading ? (
          <div className="p-6 text-center">
            <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
              <Trees className="h-7 w-7 text-muted-foreground/60" />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1">
              {error ? 'Error Loading Interventions' : activeFilterCount > 0 ? 'No Matching Interventions' : 'No Interventions Found'}
            </h3>
            <p className="text-muted-foreground text-xs mb-4">
              {error ? 'Please try again later.' : activeFilterCount > 0 ? 'Try adjusting your search or filters.' : 'Create your first intervention to get started.'}
            </p>
            {error ? (
              <Button size="sm" onClick={fetchInterventionData}>Retry</Button>
            ) : activeFilterCount > 0 ? (
              <Button size="sm" variant="outline" onClick={clearAllFilters}>Clear Filters</Button>
            ) : (
              <Button size="sm" onClick={onCreate}>Create Intervention</Button>
            )}
          </div>
        ) : (
          <div ref={listRef} className="p-3 space-y-2">
            {interventions.map((intervention) => (
              <div key={intervention.id} data-uid={intervention.uid}>
                <InterventionCard
                  intervention={intervention}
                  isSelected={selectedIntervention?.id === intervention.id}
                  onClick={() => onSelect(intervention)}
                  isMultiSelectMode={isBulkMode}
                  isChecked={selectedUids.has(intervention.uid)}
                  onToggleSelect={(e) => { e.stopPropagation(); onToggleSelect(intervention.uid, e.shiftKey) }}
                  isDisabled={isBulkMode && lockedType !== null && intervention.type !== lockedType}
                  disabledTooltip="Bulk edit requires same intervention type"
                />
              </div>
            ))}

            {hasMore && (
              <div ref={observerRef} className="py-4 text-center">
                {loading
                  ? <Loader className="w-4 h-4 animate-spin text-primary mx-auto" />
                  : <p className="text-xs text-muted-foreground">Load more...</p>}
              </div>
            )}

            {!hasMore && interventions.length > 0 && (
              <div className="py-4 text-center">
                <p className="text-xs text-muted-foreground/70">Showing all {total.toLocaleString('en-US')} results</p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
