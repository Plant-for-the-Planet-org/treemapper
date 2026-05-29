'use client'

import React from 'react'
import { Search, ArrowUp, ArrowDown, CheckSquare, X, Trees, Loader } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
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
  onToggleSelect: (uid: string) => void
  onEnterBulkMode: () => void
  onExitBulkMode: () => void
  onOpenBulkUpdate: () => void
  onOpenBulkSpeciesEdit: () => void
  onOpenBulkStartDateEdit: () => void
  lockedType: string | null
}

const labelize = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

export const InterventionsPanel = ({
  interventions, selectedIntervention, onSelect, loading, error,
  searchTerm, setSearchTerm, filters, setFilters, interventionTypes, sites,
  pagination, activeFilterCount, clearAllFilters, hasMore, observerRef, fetchInterventionData, onCreate,
  isBulkMode, selectedUids, onToggleSelect, onEnterBulkMode, onExitBulkMode,
  onOpenBulkUpdate, onOpenBulkSpeciesEdit, onOpenBulkStartDateEdit, lockedType,
}: Props) => {
  const setFilter = (key: string, value: string) =>
    setFilters((prev: any) => ({ ...prev, [key]: value === 'all' ? '' : value }))

  const toggleSort = () =>
    setFilters((prev: any) => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))

  return (
    <div className="w-full h-full flex flex-col bg-background border-r border-border/50">
      {/* Filters */}
      <div className="p-3 space-y-2 border-b border-border/50 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={14} />
          <Input
            placeholder="Search by HID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select value={filters.type || 'all'} onValueChange={(v) => setFilter('type', v)}>
            <SelectTrigger size="sm" className="h-8 text-xs">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Types</SelectItem>
              {interventionTypes.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">{labelize(t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.projectSiteId || 'all'} onValueChange={(v) => setFilter('projectSiteId', v)}>
            <SelectTrigger size="sm" className="h-8 text-xs">
              <SelectValue placeholder="All Sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Sites</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s.id} value={String(s.id)} className="text-xs">{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.captureMode || 'all'} onValueChange={(v) => setFilter('captureMode', v)}>
            <SelectTrigger size="sm" className="h-8 text-xs">
              <SelectValue placeholder="All Capture Modes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Capture Modes</SelectItem>
              <SelectItem value="on-site" className="text-xs">On Site</SelectItem>
              <SelectItem value="off-site" className="text-xs">Off Site</SelectItem>
              <SelectItem value="external" className="text-xs">External</SelectItem>
              <SelectItem value="unknown" className="text-xs">Unknown</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Select value={filters.flag || 'all'} onValueChange={(v) => setFilter('flag', v)}>
              <SelectTrigger size="sm" className="h-8 text-xs flex-1">
                <SelectValue placeholder="All Items" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Items</SelectItem>
                <SelectItem value="true" className="text-xs">Flagged Only</SelectItem>
                <SelectItem value="false" className="text-xs">Not Flagged</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={toggleSort}
              title="Sort by date"
              className="flex items-center gap-0.5 h-8 px-2 rounded-md border border-border bg-background text-muted-foreground hover:bg-muted/50 text-xs transition-colors"
            >
              {filters.sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>{pagination.total || interventions.length} intervention{(pagination.total || interventions.length) !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="text-primary hover:underline">
                Clear filters
              </button>
            )}
            {!isBulkMode && interventions.length > 0 && (
              <button onClick={onEnterBulkMode} className="text-primary hover:underline font-medium">
                Select
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {isBulkMode && (
        <div className="px-3 py-2 bg-primary flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-primary-foreground text-xs font-medium">
            <CheckSquare size={14} />
            <span>{selectedUids.size} selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="secondary" className="h-7 text-xs px-2" disabled={selectedUids.size === 0} onClick={onOpenBulkUpdate}>Assign Site</Button>
            <Button size="sm" variant="secondary" className="h-7 text-xs px-2" disabled={selectedUids.size === 0} onClick={onOpenBulkSpeciesEdit}>Species</Button>
            <Button size="sm" variant="secondary" className="h-7 text-xs px-2" disabled={selectedUids.size === 0} onClick={onOpenBulkStartDateEdit}>Date</Button>
            <button onClick={onExitBulkMode} className="p-1 text-primary-foreground/80 hover:text-primary-foreground transition-colors">
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
          <div className="p-3 space-y-2">
            {interventions.map((intervention) => (
              <InterventionCard
                key={intervention.id}
                intervention={intervention}
                isSelected={selectedIntervention?.id === intervention.id}
                onClick={() => onSelect(intervention)}
                isMultiSelectMode={isBulkMode}
                isChecked={selectedUids.has(intervention.uid)}
                onToggleSelect={(e) => { e.stopPropagation(); onToggleSelect(intervention.uid) }}
                isDisabled={isBulkMode && lockedType !== null && intervention.type !== lockedType}
                disabledTooltip="Bulk edit requires same intervention type"
              />
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
                <p className="text-xs text-muted-foreground/70">Showing all {pagination.total} results</p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
