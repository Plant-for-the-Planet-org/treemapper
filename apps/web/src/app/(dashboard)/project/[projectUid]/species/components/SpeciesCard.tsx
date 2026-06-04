import { motion } from 'framer-motion'
import { Leaf, Heart, EyeOff, Eye, TreePine, LeafIcon, HelpCircle } from 'lucide-react'
import { cdnUrl } from '@/lib/cdn'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const formatRelativeTime = (d?: string) => {
  if (!d) return ''
  try {
    const date = parseISO(d)
    const diffDays = (Date.now() - date.getTime()) / 86400000
    if (diffDays < 7) return formatDistanceToNow(date, { addSuffix: true })
    return format(date, 'MMM d, yyyy')
  } catch { return d }
}

export const SpeciesCard = ({
  species,
  isSelected,
  onClick,
  onToggleFavorite,
  onToggleDisabled,
  isUnknown,
}: any) => {
  const isDisabled = species.isDisabled || species.disabled
  const trees = species.totalCount || species.totalSpecimenCount || species.count || 0
  const interventions = species.interventionCount || species.interventionUsageCount || (isUnknown ? 1 : 0)
  const lastUpdated = formatRelativeTime(species.updatedAt || species.createdAt)

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card
        onClick={onClick}
        className={cn(
          'py-0 gap-0 cursor-pointer transition-colors',
          isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-border/80',
          isDisabled && 'opacity-60'
        )}
      >
        <CardContent className="p-3 flex gap-3">
          {/* Image */}
          <div className="w-14 h-14 bg-muted/40 rounded-md overflow-hidden flex-shrink-0">
            {species.image ? (
              <img
                src={cdnUrl('species', species.image) ?? ''}
                alt={species.commonName || species.speciesName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Leaf size={20} className="text-muted-foreground/60" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            {/* Title + actions */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="text-sm font-medium truncate italic">
                    {species.scientificName || species.speciesName}
                  </h3>
                  {isUnknown && <HelpCircle size={12} className="text-muted-foreground flex-shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  {species.commonName || species.speciesName}
                </p>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0 -mt-1 -mr-1">
                {species.projectSpeciesUid && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleFavorite(species.uid, !species.favourite, species.projectSpeciesUid)
                    }}
                    className={cn(
                      'p-1 rounded transition-colors',
                      species.favourite ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground/50 hover:text-red-400'
                    )}
                    title={species.favourite ? 'Unfavorite' : 'Favorite'}
                  >
                    <Heart size={12} fill={species.favourite ? 'currentColor' : 'none'} />
                  </button>
                )}
                {species.projectSpeciesUid && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleDisabled(species.uid, !isDisabled, species.projectSpeciesUid)
                    }}
                    className={cn(
                      'p-1 rounded transition-colors',
                      isDisabled ? 'text-muted-foreground hover:text-foreground' : 'text-primary hover:text-primary/80'
                    )}
                    title={isDisabled ? 'Enable' : 'Disable'}
                  >
                    {isDisabled ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              {trees > 0 && (
                <div className="flex items-center gap-1">
                  <TreePine size={12} className="text-muted-foreground/60" />
                  <span className="font-medium text-foreground">{trees.toLocaleString('en-US')}</span>
                </div>
              )}
              {interventions > 0 && (
                <div className="flex items-center gap-1">
                  <LeafIcon size={12} className="text-muted-foreground/60" />
                  <span className="font-medium text-foreground">{interventions}</span>
                </div>
              )}
            </div>

            {/* Sources row */}
            {species.sources?.length > 0 && (
              <div className="flex items-center gap-1.5">
                {species.sources.map((source: string) => (
                  <Badge
                    key={source}
                    variant="secondary"
                    className={cn(
                      'text-[10px] px-1.5 py-0 capitalize',
                      source === 'project' && 'bg-primary/10 text-primary'
                    )}
                  >
                    {source}
                  </Badge>
                ))}
              </div>
            )}

            {lastUpdated && (
              <span className="text-[10px] text-muted-foreground/70 truncate">{lastUpdated}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
