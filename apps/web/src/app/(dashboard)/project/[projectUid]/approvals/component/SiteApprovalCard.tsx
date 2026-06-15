'use client'

import React from 'react'
import { SiteApprovalData, mapReviewStatusToLegacyStatus } from '@shared-core/types/approval.types'
import { Card } from '@/components/ui/card'
import { Clock, Maximize2, TreeDeciduous, MapPin, MessageSquare } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { STATUS_STYLES, REVIEW_STATUS_PILL, avatarColor, initials, titleCase } from './approvalUi'

interface SiteApprovalCardProps {
  site: SiteApprovalData
  onClick: () => void
  isDragging?: boolean
}

export const SiteApprovalCard: React.FC<SiteApprovalCardProps> = ({ site, onClick, isDragging = false }) => {
  const {
    attributes, listeners, setNodeRef, transform, transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: site.siteId })

  const style = { transform: CSS.Transform.toString(transform), transition }

  const legacyStatus = mapReviewStatusToLegacyStatus(site.reviewStatus || 'pending')
  const accent = STATUS_STYLES[legacyStatus]
  const pill = site.reviewStatus ? REVIEW_STATUS_PILL[site.reviewStatus] : undefined

  const commentsCount = site.comments?.length || 0
  const creator = site.createdBy?.name || 'Unknown'
  const area = site.siteData?.area

  return (
    <Card
      ref={setNodeRef}
      style={style}
      size="sm"
      {...attributes}
      {...listeners}
      className={cn(
        'gap-2.5 px-3.5 cursor-pointer ring-foreground/[0.07] hover:ring-foreground/15 hover:shadow-md transition-all duration-200',
        (isDragging || isSortableDragging) && 'opacity-60 shadow-lg ring-2 ' + accent.ring
      )}
      onClick={onClick}
    >
      {/* Top row: UID + status pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn('text-xs font-semibold tracking-tight truncate', accent.text)}>
            {site.siteUid}
          </span>
          <Clock size={11} className="text-muted-foreground/70 shrink-0" />
        </div>
        {pill ? (
          <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium', pill.className)}>
            {pill.label}
          </span>
        ) : (
          <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {titleCase(site.siteData.status)}
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{site.name}</h4>

      {site.description && (
        <p className="text-[11px] text-muted-foreground line-clamp-2">{site.description}</p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
        {!!area && (
          <span className="flex items-center gap-1">
            <Maximize2 size={12} />{(area / 10000).toFixed(2)} ha
          </span>
        )}
        {!!site.siteData?.expectedTreeCount && (
          <span className="flex items-center gap-1">
            <TreeDeciduous size={12} />{site.siteData.expectedTreeCount.toLocaleString()}
          </span>
        )}
      </div>

      {/* Project line */}
      {site.projectName && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">{site.projectName}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
            avatarColor(creator)
          )}>
            {initials(creator)}
          </span>
          <span className="text-xs text-foreground/80 truncate max-w-[120px]">{creator}</span>
        </div>
        {commentsCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
            <MessageSquare size={12} />{commentsCount}
          </span>
        )}
      </div>
    </Card>
  )
}
