import { motion } from 'framer-motion'
import { Search, AlertCircle, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export const SpeciesSearch = ({
  searchTerm,
  onSearchChange,
  searchResults,
  isSearching,
  onSelectSpecies,
  onRequestNew,
}: any) => (
  <div className="space-y-3">
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={searchTerm}
        onChange={(e: any) => onSearchChange(e.target.value)}
        placeholder="Search species database..."
        className="pl-9 h-10"
      />
    </div>

    {isSearching && (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" />
      </div>
    )}

    {searchResults.length > 0 && (
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {searchResults.map((species: any) => (
          <motion.button
            key={species.id}
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => onSelectSpecies(species)}
            className="w-full text-left p-3 border border-border rounded-md hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <h4 className="text-sm font-medium italic">{species.scientificName}</h4>
            <p className="text-xs text-muted-foreground">{species.commonName}</p>
          </motion.button>
        ))}
      </div>
    )}

    {searchTerm.length >= 3 && !isSearching && searchResults.length === 0 && (
      <div className="text-center py-6">
        <AlertCircle size={32} className="text-muted-foreground/60 mx-auto mb-2" />
        <h3 className="text-sm font-medium mb-1">Species not found</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Can't find "{searchTerm}" in our database
        </p>
        <Button size="sm" onClick={onRequestNew}>
          Request this species
        </Button>
      </div>
    )}

    {searchTerm.length < 3 && (
      <div className="text-center py-6 text-muted-foreground">
        <Search size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">Enter at least 3 characters to search</p>
      </div>
    )}
  </div>
)
