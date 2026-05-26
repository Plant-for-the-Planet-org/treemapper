'use client'

import React from 'react'
import { InterventionApprovalData } from '@shared-core/types/approval.types'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, ImageIcon, User, Calendar, TreesIcon, FlaskConical, Leaf, Ruler, CheckCircle2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ApprovalCardProps {
  intervention: InterventionApprovalData
  onClick: () => void
  isDragging?: boolean
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({ intervention, onClick, isDragging = false }) => {
  const {
    attributes, listeners, setNodeRef, transform, transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: intervention.interventionId })

  const style = { transform: CSS.Transform.toString(transform), transition }

  const formatType = (type: string) =>
    type.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  const getTimeAgo = (date: string | null) => {
    if (!date) return ''
    try { return formatDistanceToNow(new Date(date), { addSuffix: true }) } catch { return '' }
  }

  const commentsCount = intervention.comments?.length || 0
  const hasImage = intervention.interventionData?.image
  const sampleTreeCount = intervention.interventionData?.totalSampleTreeCount ?? intervention.interventionData?.sampleTrees?.length ?? 0
  const uniqueSpecies = intervention.interventionData?.speciesCount
    ?? (intervention.interventionData?.sampleTrees
      ? [...new Set(intervention.interventionData.sampleTrees.map((t) => t.species).filter(Boolean))].length
      : 0)

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 cursor-pointer hover:shadow-md hover:border-border/80 transition-all duration-200 gap-2 ${
        isDragging || isSortableDragging ? 'opacity-50 scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {intervention.projectName && (
            <div className="text-xs text-muted-foreground truncate mb-0.5">{intervention.projectName}</div>
          )}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-primary">#{intervention.interventionHid}</span>
            {hasImage && (
              <Badge variant="secondary" className="h-5 px-1.5">
                <ImageIcon size={12} />
              </Badge>
            )}
          </div>
          <h4 className="text-sm font-semibold text-foreground line-clamp-2">{formatType(intervention.type)}</h4>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1">
          <TreesIcon size={12} />
          <span>{intervention.interventionData?.totalTreeCount || 0} trees</span>
        </div>
        {sampleTreeCount > 0 && (
          <div className="flex items-center gap-1">
            <FlaskConical size={12} />
            <span>{sampleTreeCount} samples</span>
          </div>
        )}
        {uniqueSpecies > 0 && (
          <div className="flex items-center gap-1">
            <Leaf size={12} />
            <span>{uniqueSpecies} species</span>
          </div>
        )}
        {intervention.interventionData?.area && (
          <div className="flex items-center gap-1">
            <Ruler size={12} />
            <span>{intervention.interventionData.area.toFixed(0)} m²</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <User size={12} />
          <span className="truncate max-w-[120px]">{intervention.createdBy.name}</span>
        </div>
        {commentsCount > 0 && (
          <Badge variant="outline" className="h-5 px-1.5">
            <MessageSquare size={12} className="mr-1" />
            {commentsCount}
          </Badge>
        )}
      </div>

      {intervention.submittedForReviewAt && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar size={12} />
          <span>{getTimeAgo(intervention.submittedForReviewAt)}</span>
        </div>
      )}

      {intervention.approvedBy && (
        <Badge variant="outline" className="self-start border-primary/30 text-primary bg-primary/10">
          <CheckCircle2 size={12} className="mr-1" />
          {intervention.approvedBy.name}
        </Badge>
      )}
    </Card>
  )
}
