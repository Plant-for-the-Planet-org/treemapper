import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { MapPin, Calendar, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

const STATUS_DOT: Record<string, string> = {
  planting: 'bg-primary',
  planning: 'bg-primary/50',
  completed: 'bg-muted-foreground/40',
  barren: 'bg-amber-500',
}

const initials = (name?: string) =>
  name ? name.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('') : '?'

const formatDate = (d?: string) => {
  if (!d) return ''
  try { return format(parseISO(d), 'MMMM d, yyyy') } catch { return d }
}

const formatArea = (area?: string) => {
  if (!area || area === 'Not available') return '—'
  const match = area.match(/([\d,.]+)/)
  if (!match) return area
  const num = parseFloat(match[1].replace(/,/g, ''))
  if (isNaN(num)) return area
  return `${num.toLocaleString('en-US', { maximumFractionDigits: 1 })} ha`
}

export const SiteCard = ({ site, isSelected, onSelect }: any) => {
  const dot = STATUS_DOT[site.status] || 'bg-muted-foreground/40'
  const creatorAvatar = site.member?.avatars?.find((a: any) => a.displayName === site.createdBy)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(site)}
      className={cn(
        'cursor-pointer rounded-lg border p-3 transition-colors',
        isSelected
          ? 'bg-primary/10 border-primary/30'
          : 'bg-background hover:bg-muted/50 border-border'
      )}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-start gap-1.5 min-w-0 flex-1">
          <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5', dot)} title={site.status} />
          <h3 className="font-medium text-foreground text-sm leading-snug break-words">{site.name}</h3>
        </div>
        {site.member?.totalCount > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0 text-xs text-muted-foreground mt-0.5">
            <Users size={12} className="text-muted-foreground/60" />
            <span>{site.member.totalCount}</span>
          </div>
        )}
      </div>

      {/* Footer: area · date · avatar */}
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mt-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1">
            <MapPin size={12} className="text-muted-foreground/60" />
            <span className="font-medium text-foreground/80">{formatArea(site.area)}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <Calendar size={12} className="text-muted-foreground/60 flex-shrink-0" />
            <span className="truncate">{formatDate(site.createdAt)}</span>
          </div>
        </div>
        {site.createdBy && (
          <Avatar size="sm" title={site.createdBy} className="bg-background">
            <AvatarImage src={creatorAvatar?.image} alt={site.createdBy} />
            <AvatarFallback className="text-[9px]">{initials(site.createdBy)}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </motion.div>
  )
}
