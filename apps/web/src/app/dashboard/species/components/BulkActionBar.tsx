import { motion } from 'framer-motion'
import { CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const BulkActionBar = ({ selectedCount, onAssignSpecies, onClearSelection }: any) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="fixed top-0 left-0 right-0 z-40 bg-primary text-primary-foreground px-4 py-3 shadow-lg"
  >
    <div className="flex items-center justify-between max-w-7xl mx-auto gap-3">
      <div className="flex items-center gap-2 text-sm">
        <CheckSquare size={16} />
        <span className="font-medium">{selectedCount} unknown species selected</span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={onAssignSpecies} className="h-8">
          Assign Scientific Species
        </Button>
        <Button size="sm" variant="ghost" onClick={onClearSelection} className="h-8 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
          Clear
        </Button>
      </div>
    </div>
  </motion.div>
)
