'use client'

import React from 'react'
import { ApprovalBoardColumn, ApprovalEntityType } from '@shared-core/types/approval.types'
import { ApprovalCard } from './ApprovalCard'
import { SiteApprovalCard } from './SiteApprovalCard'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import { STATUS_STYLES } from './approvalUi'

interface ApprovalColumnProps {
  column: ApprovalBoardColumn
  onCardClick: (id: number) => void
  entityType: ApprovalEntityType
}

export const ApprovalColumn: React.FC<ApprovalColumnProps> = ({ column, onCardClick, entityType }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.status })
  const accent = STATUS_STYLES[column.status]

  const itemIds = entityType === 'intervention'
    ? column.interventions.map((i) => i.interventionId)
    : column.sites.map((s) => s.siteId)

  const itemCount = entityType === 'intervention' ? column.interventions.length : column.sites.length
  const emptyMessage = entityType === 'intervention' ? 'No interventions' : 'No sites'

  return (
    <div className="flex flex-col min-w-[300px] max-w-[300px] flex-1">
      {/* Column header */}
      <div className={cn('flex items-center justify-between rounded-xl px-3 py-2.5', accent.tint)}>
        <div className="flex items-center gap-2">
          <span className={cn('size-2 rounded-full', accent.dot)} />
          <h3 className="text-[13px] font-semibold text-foreground">{column.title}</h3>
        </div>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/70 px-1.5 text-[11px] font-semibold text-foreground/70">
          {itemCount}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'mt-2 flex-1 rounded-xl p-1.5 overflow-y-auto max-h-[calc(100vh-300px)] transition-colors',
          isOver ? cn('ring-2', accent.ring, accent.tint) : ''
        )}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {itemCount === 0 ? (
            <div className="flex items-center justify-center h-28 rounded-lg border border-dashed border-border text-xs text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            <div className="space-y-2.5">
              {entityType === 'intervention'
                ? column.interventions.map((intervention) => (
                  <ApprovalCard
                    key={intervention.interventionId}
                    intervention={intervention}
                    onClick={() => onCardClick(intervention.interventionId)}
                  />
                ))
                : column.sites.map((site) => (
                  <SiteApprovalCard
                    key={site.siteId}
                    site={site}
                    onClick={() => onCardClick(site.siteId)}
                  />
                ))}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  )
}
