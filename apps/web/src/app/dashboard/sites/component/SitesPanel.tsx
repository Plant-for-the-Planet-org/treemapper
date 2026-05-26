'use client'

import { Search, Calendar, LandPlot, ArrowUp, ArrowDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { LoadingState } from './LoadingState'
import { SiteCard } from './SiteCard'

interface Props {
  sites: any[]
  filteredSites: any[]
  selectedSite: any
  onSiteSelect: (s: any) => void
  loading: boolean
  searchTerm: string
  setSearchTerm: (s: string) => void
  statusFilter: string
  setStatusFilter: (s: string) => void
  sortBy: string
  setSortBy: (s: string) => void
  sortDir: string
  setSortDir: (s: string) => void
}

const STATUS_DOT: Record<string, string> = {
  planting: 'bg-[#007A49]',
  planning: 'bg-[#7FB89A]',
  completed: 'bg-gray-400',
  barren: 'bg-amber-500',
}

const StatusOption = ({ value, label }: { value: string; label: string }) => (
  <div className="flex items-center gap-2">
    {STATUS_DOT[value] && <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[value]}`} />}
    <span>{label}</span>
  </div>
)

export const SitesPanel = ({
  filteredSites, selectedSite, onSiteSelect, loading,
  searchTerm, setSearchTerm, statusFilter, setStatusFilter, sortBy, setSortBy, sortDir, setSortDir,
}: Props) => {
  const handleSort = (field: string) => {
    if (sortBy === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('desc') }
  }
  const SortIcon = ({ field, Icon, label }: { field: string; Icon: any; label: string }) => {
    const active = sortBy === field
    return (
      <button
        onClick={() => handleSort(field)}
        title={`Sort by ${label}`}
        className={cn(
          'flex items-center gap-0.5 h-8 px-2 rounded-md border text-xs transition-colors',
          active
            ? 'bg-[#e6f1ec] border-[#007A49]/30 text-[#007A49]'
            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
        )}
      >
        <Icon size={14} />
        {active && (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </button>
    )
  }
  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-gray-100">
      {/* Search + filter */}
      <div className="p-3 space-y-2 border-b border-gray-100 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <Input
            placeholder="Search sites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger size="sm" className="h-8 text-xs flex-1">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs"><span>All Status</span></SelectItem>
              <SelectItem value="planning" className="text-xs"><StatusOption value="planning" label="Planning" /></SelectItem>
              <SelectItem value="planting" className="text-xs"><StatusOption value="planting" label="Planting" /></SelectItem>
              <SelectItem value="completed" className="text-xs"><StatusOption value="completed" label="Completed" /></SelectItem>
              <SelectItem value="barren" className="text-xs"><StatusOption value="barren" label="Barren" /></SelectItem>
            </SelectContent>
          </Select>
          <SortIcon field="created" Icon={Calendar} label="date" />
          <SortIcon field="area" Icon={LandPlot} label="area" />
        </div>
        <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
          <span>{filteredSites.length} site{filteredSites.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Sites list */}
      <ScrollArea className="flex-1 min-h-0">
        {loading ? (
          <LoadingState message="Loading sites..." />
        ) : (
          <div className="p-3 space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredSites.map((site) => (
                <SiteCard
                  key={site.id}
                  site={site}
                  isSelected={selectedSite?.id === site.id}
                  onSelect={onSiteSelect}
                />
              ))}
            </AnimatePresence>
            {!loading && filteredSites.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 text-center text-gray-500"
              >
                <Search className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <h3 className="text-xs font-medium text-gray-700 mb-1">No sites found</h3>
                <p className="text-[10px] text-gray-500">Try adjusting your search</p>
              </motion.div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
