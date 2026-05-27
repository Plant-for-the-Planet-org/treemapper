'use client'

import React from 'react'
import { SiteApprovalData } from '@shared-core/types/approval.types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, TreesIcon, User } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'

interface SiteApprovalCardProps {
  site: SiteApprovalData
  onClick: () => void
  isDragging?: boolean
}

const statusVariant = (status: string): 'default' | 'secondary' | 'outline' => {
  switch (status) {
    case 'planted':
    case 'reforestation':
      return 'default'
    case 'planting':
      return 'secondary'
    default:
      return 'outline'
  }
}

export const SiteApprovalCard: React.FC<SiteApprovalCardProps> = ({ site, onClick, isDragging = false }) => {
  const {
    attributes, listeners, setNodeRef, transform, transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: site.siteId })

  const style = { transform: CSS.Transform.toString(transform), transition }

  const formatType = (type: string) =>
    type.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    try { return format(new Date(date), 'MMM dd, yyyy') } catch { return date }
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 cursor-pointer hover:shadow-md hover:border-border/80 transition-all gap-2 ${
        isDragging || isSortableDragging ? 'opacity-50 scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {site.projectName && (
            <div className="text-xs text-muted-foreground truncate mb-0.5">{site.projectName}</div>
          )}
          <h4 className="font-semibold text-foreground text-sm line-clamp-1">{site.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{site.siteUid}</p>
        </div>
      </div>

      <Badge variant={statusVariant(site.siteData.status)} className="self-start">
        {formatType(site.siteData.status)}
      </Badge>

      {site.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{site.description}</p>
      )}

      <div className="space-y-1.5 text-xs text-foreground/80">
        {site.siteData.area && (
          <div className="flex items-center gap-1.5">
            <MapPin size={12} className="text-muted-foreground" />
            <span>{(site.siteData.area / 10000).toFixed(2)} hectares</span>
          </div>
        )}
        {site.siteData.expectedTreeCount && (
          <div className="flex items-center gap-1.5">
            <TreesIcon size={12} className="text-muted-foreground" />
            <span>{site.siteData.expectedTreeCount.toLocaleString()} trees planned</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <User size={12} className="text-muted-foreground" />
          <span>{site.createdBy.name}</span>
        </div>
        {site.siteData.plannedPlantingDate && (
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-muted-foreground" />
            <span>Planned: {formatDate(site.siteData.plannedPlantingDate)}</span>
          </div>
        )}
      </div>

      {site.comments.length > 0 && (
        <div className="pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {site.comments.length} comment{site.comments.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </Card>
  )
}
