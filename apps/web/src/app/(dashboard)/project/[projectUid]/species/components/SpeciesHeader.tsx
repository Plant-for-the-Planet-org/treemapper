import { Leaf, HelpCircle, Search, Eye, EyeOff, Hash, ChevronDown, Filter } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export const SpeciesHeader = ({
  speciesCount,
  scientificCount,
  unknownCount,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  showDisabled,
  setShowDisabled,
  showUnknown,
  setShowUnknown,
  speciesTypeFilter,
  setSpeciesTypeFilter,
  sourceFilter,
  setSourceFilter,
}: any) => {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="bg-background border-b border-border sticky top-0 z-10">
      <div className="px-5 py-3">
        <div className="flex justify-between items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search species..."
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="secondary" className="gap-1">
                <Hash size={12} />
                {speciesCount}
              </Badge>
              <Badge className="gap-1">
                <Leaf size={12} />
                {scientificCount}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <HelpCircle size={12} />
                {unknownCount}
              </Badge>
            </div>
          </div>

          <Button
            variant={showFilters ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-8 gap-1.5 text-xs"
          >
            <Filter size={14} />
            Filters
            <ChevronDown size={14} className={cn('transition-transform', showFilters && 'rotate-180')} />
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
            <Select value={speciesTypeFilter} onValueChange={setSpeciesTypeFilter}>
              <SelectTrigger size="sm" className="h-8 text-xs w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                <SelectItem value="scientific" className="text-xs">Scientific Only</SelectItem>
                <SelectItem value="unknown" className="text-xs">Unknown Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger size="sm" className="h-8 text-xs w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Sources</SelectItem>
                <SelectItem value="project" className="text-xs">Project Only</SelectItem>
                <SelectItem value="intervention" className="text-xs">Intervention Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger size="sm" className="h-8 text-xs w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name" className="text-xs">Sort: Name</SelectItem>
                <SelectItem value="date" className="text-xs">Sort: Date</SelectItem>
                <SelectItem value="favorite" className="text-xs">Sort: Favorite</SelectItem>
                <SelectItem value="interventionCount" className="text-xs">Sort: Interventions</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showDisabled ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowDisabled(!showDisabled)}
              className="h-8 gap-1.5 text-xs"
            >
              {showDisabled ? <Eye size={14} /> : <EyeOff size={14} />}
              Disabled
            </Button>
            <Button
              variant={showUnknown ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowUnknown(!showUnknown)}
              className="h-8 gap-1.5 text-xs"
            >
              {showUnknown ? <Eye size={14} /> : <EyeOff size={14} />}
              Unknown
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
