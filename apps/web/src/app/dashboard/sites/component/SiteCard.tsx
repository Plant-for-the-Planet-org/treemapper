import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { MapPin, Calendar, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_DOT: Record<string, string> = {
  planting: 'bg-[#007A49]',     // brand green: active
  planning: 'bg-[#7FB89A]',     // light green: upcoming
  completed: 'bg-gray-400',     // done
  barren: 'bg-amber-500',       // needs attention
}

const AVATAR_BG = [
  'bg-[#e6f1ec] text-[#007A49]',
  'bg-amber-50 text-amber-700',
  'bg-gray-100 text-gray-700',
]

const initials = (name?: string) =>
  name ? name.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('') : '?'

const colorFor = (name?: string) => {
  if (!name) return AVATAR_BG[0]
  const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  return AVATAR_BG[hash % AVATAR_BG.length]
}

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
  const dot = STATUS_DOT[site.status] || 'bg-gray-300'
  const creatorAvatar = site.member?.avatars?.find((a: any) => a.displayName === site.createdBy)
  const avatarColor = colorFor(site.createdBy)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(site)}
      className={cn(
        'cursor-pointer rounded-lg border p-3 transition-colors',
        isSelected
          ? 'bg-green-50/60 border-green-200'
          : 'bg-white hover:bg-gray-50 border-gray-200'
      )}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-start gap-1.5 min-w-0 flex-1">
          <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5', dot)} title={site.status} />
          <h3 className="font-medium text-gray-900 text-sm leading-snug break-words">{site.name}</h3>
        </div>
        {site.member?.totalCount > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0 text-xs text-gray-500 mt-0.5">
            <Users size={12} className="text-gray-400" />
            <span>{site.member.totalCount}</span>
          </div>
        )}
      </div>

      {/* Footer: area · date · avatar */}
      <div className="flex items-center justify-between gap-2 text-xs text-gray-500 mt-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1">
            <MapPin size={12} className="text-gray-400" />
            <span className="font-medium text-gray-700">{formatArea(site.area)}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <Calendar size={12} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{formatDate(site.createdAt)}</span>
          </div>
        </div>
        {site.createdBy && (
          <div
            className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0"
            title={site.createdBy}
          >
            {creatorAvatar?.image ? (
              <img src={creatorAvatar.image} alt={site.createdBy} className="w-full h-full object-cover" />
            ) : (
              <div className={cn('w-full h-full flex items-center justify-center text-[9px] font-medium', avatarColor)}>
                {initials(site.createdBy)}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
