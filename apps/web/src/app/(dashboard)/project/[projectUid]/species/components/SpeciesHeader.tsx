import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const VIEW_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'native', label: 'Native' },
  { value: 'nonnative', label: 'Non native' },
  { value: 'favourites', label: 'Favourites' },
  { value: 'disabled', label: 'Disabled' },
] as const

const SORTS = [
  { value: 'name', label: 'Name A-Z' },
  { value: 'date', label: 'Recent' },
] as const

export const SpeciesHeader = ({
  projectName,
  speciesCount,
  nativePercent,
  unknownCount,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  viewFilter,
  setViewFilter,
}: any) => {
  return (
    <div className="space-y-4">
      {/* Title + badges */}
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl font-bold text-foreground">Species</h1>
          <Badge variant="secondary" className="text-[11px]">
            {speciesCount} species
          </Badge>
          <Badge variant="secondary" className="bg-primary/10 text-primary text-[11px]">
            {nativePercent}% native
          </Badge>
          {unknownCount > 0 && (
            <Badge variant="secondary" className="bg-amber-50 text-amber-700 text-[11px]">
              {unknownCount} unknown awaiting review
            </Badge>
          )}
        </div>
        {projectName && (
          <p className="text-sm text-muted-foreground mt-1">
            Restoration palette for {projectName}
          </p>
        )}
      </div>

      {/* Toolbar: search + pills + sort */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search species, common name..."
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg overflow-x-auto">
          {VIEW_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setViewFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
                viewFilter === f.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Sort by</span>
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg">
            {SORTS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSortBy(s.value)}
                className={cn(
                  'px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
                  sortBy === s.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
