'use client'

import React from 'react'
import { InterventionApprovalData, mapReviewStatusToLegacyStatus } from '@shared-core/types/approval.types'
import { Card } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Lock, Clock, TreeDeciduous, Sprout, Leaf, Maximize2, MapPin, AlertCircle } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { STATUS_STYLES, REVIEW_STATUS_PILL, avatarColor, initials, titleCase } from './approvalUi'

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

  const getTimeAgo = (date: string | null) => {
    if (!date) return ''
    try { return formatDistanceToNow(new Date(date), { addSuffix: false }) } catch { return '' }
  }

  const legacyStatus = mapReviewStatusToLegacyStatus(intervention.reviewStatus || 'pending')
  const accent = STATUS_STYLES[legacyStatus]
  const pill = intervention.reviewStatus ? REVIEW_STATUS_PILL[intervention.reviewStatus] : undefined

  const commentsCount = intervention.comments?.length || 0
  const issues = intervention.unresolvedIssuesCount || 0
  const isPrivate = intervention.interventionData?.isPrivate
  const isSingleTree = intervention.type === 'single-tree-registration'
  const sampleTreeCount = intervention.interventionData?.totalSampleTreeCount
    ?? intervention.interventionData?.sampleTrees?.length ?? 0
  const speciesCount = intervention.interventionData?.speciesCount ?? 0
  const area = intervention.interventionData?.area
  const creator = intervention.createdBy?.name || 'Unknown'

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
      {/* Top row: HID + meta icons, optional status pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn('text-xs font-semibold tracking-tight', accent.text)}>
            {intervention.interventionHid}
          </span>
          {isPrivate && <Lock size={11} className="text-muted-foreground shrink-0" />}
          <Clock size={11} className="text-muted-foreground/70 shrink-0" />
        </div>
        {pill && (
          <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium', pill.className)}>
            {pill.label}
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
        {titleCase(intervention.type)}
      </h4>

      {/* Stats */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <TreeDeciduous size={12} />
          {(intervention.interventionData?.totalTreeCount || 0).toLocaleString()}
        </span>
        {!isSingleTree && sampleTreeCount > 0 && (
          <span className="flex items-center gap-1"><Sprout size={12} />{sampleTreeCount}</span>
        )}
        {speciesCount > 0 && (
          <span className="flex items-center gap-1"><Leaf size={12} />{speciesCount}</span>
        )}
        {!isSingleTree && !!area && (
          <span className="flex items-center gap-1">
            <Maximize2 size={12} />{(area / 10000).toFixed(1)} ha
          </span>
        )}
      </div>

      {/* Site / project line */}
      {intervention.projectName && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">{intervention.projectName}</span>
        </div>
      )}

      {/* Footer: creator + activity */}
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
        <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground shrink-0">
          {issues > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <AlertCircle size={12} />{issues}
            </span>
          )}
          {commentsCount > 0 && (
            <span className="flex items-center gap-1"><MessageSquare size={12} />{commentsCount}</span>
          )}
          {intervention.submittedForReviewAt && (
            <span>{getTimeAgo(intervention.submittedForReviewAt)}</span>
          )}
        </div>
      </div>
    </Card>
  )
}
