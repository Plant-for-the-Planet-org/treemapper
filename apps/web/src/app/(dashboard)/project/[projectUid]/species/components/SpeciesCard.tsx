import { motion } from 'framer-motion'
import { Leaf, Heart, EyeOff, Eye, Activity } from 'lucide-react'
import { cdnUrl } from '@/lib/cdn'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatNumber } from '@shared-core/utils/numberFormatingHelper'

export const SpeciesCard = ({
  species,
  isSelected,
  onClick,
  onToggleFavorite,
  onToggleDisabled,
  canManage = false,
}: any) => {
  const isDisabled = species.isDisabled || species.disabled
  const trees = species.totalCount || species.totalSpecimenCount || species.count || 0
  const interventions = species.interventionCount || species.interventionUsageCount || 0
  // Favourite and disable are owner/admin only on the server, so contributors
  // are not shown buttons that would silently fail.
  const canAct = canManage && !!species.projectSpeciesUid

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card
        onClick={onClick}
        className={cn(
          'py-0 gap-0 overflow-hidden cursor-pointer transition-colors',
          isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-border/80',
          isDisabled && 'opacity-60'
        )}
      >
        <div className="flex">
          {/* Image */}
          <div className="w-28 bg-muted/40 flex-shrink-0 relative">
            {species.image ? (
              <img
                src={cdnUrl('species', species.image) ?? ''}
                alt={species.commonName || species.speciesName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full min-h-[112px] flex items-center justify-center">
                <Leaf size={26} className="text-muted-foreground/60" />
              </div>
            )}
            {species.isNativeSpecies && (
              <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                Native
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 p-3.5 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-foreground italic truncate">
                  {species.scientificName || species.speciesName}
                </h3>
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  {species.commonName || species.speciesName}
                </p>
              </div>
              {canAct && (
                <div className="flex items-center gap-0.5 flex-shrink-0 -mt-1 -mr-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleFavorite(species.uid, !species.favourite, species.projectSpeciesUid)
                    }}
                    className={cn(
                      'p-1 rounded transition-colors',
                      species.favourite
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-muted-foreground/50 hover:text-red-400'
                    )}
                    title={species.favourite ? 'Unfavorite' : 'Favorite'}
                  >
                    <Heart size={13} fill={species.favourite ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleDisabled(species.uid, !isDisabled, species.projectSpeciesUid)
                    }}
                    className={cn(
                      'p-1 rounded transition-colors',
                      isDisabled
                        ? 'text-muted-foreground hover:text-foreground'
                        : 'text-primary hover:text-primary/80'
                    )}
                    title={isDisabled ? 'Enable' : 'Disable'}
                  >
                    {isDisabled ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              )}
            </div>

            {/* Big count */}
            <div className="mt-auto pt-3">
              <p className="text-2xl font-bold text-foreground tracking-tight leading-none">
                {formatNumber(trees)}
                <span className="text-xs font-normal text-muted-foreground ml-1.5">trees</span>
              </p>
              {interventions > 0 && (
                <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                  <Activity size={12} className="text-muted-foreground/60" />
                  <span>
                    {interventions} {interventions === 1 ? 'intervention' : 'interventions'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
