'use client';

import React from 'react';
import { ApprovalBoardColumn, ApprovalEntityType, isInterventionApproval, isSiteApproval } from '@shared-core/types/approval.types';
import { ApprovalCard } from './ApprovalCard';
import { SiteApprovalCard } from './SiteApprovalCard';
import { Badge } from '@/components/ui/badge';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface ApprovalColumnProps {
  column: ApprovalBoardColumn;
  onCardClick: (id: number) => void;
  entityType: ApprovalEntityType;
}

export const ApprovalColumn: React.FC<ApprovalColumnProps> = ({
  column,
  onCardClick,
  entityType,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.status,
  });

  // Get IDs based on entity type
  const itemIds = entityType === 'intervention'
    ? column.interventions.map((i) => i.interventionId)
    : column.sites.map((s) => s.siteId);

  const itemCount = entityType === 'intervention' ? column.interventions.length : column.sites.length;
  const emptyMessage = entityType === 'intervention' ? 'No interventions' : 'No sites';

  return (
    <div className="flex flex-col h-full min-w-[320px] max-w-[320px]">
      <div className="flex items-center justify-between px-4 py-3 rounded-t-lg bg-gray-200">
        <h3 className="text-sm font-bold text-gray-800">{column.title}</h3>
        <Badge className="bg-gray-400 text-white border-0">
          {itemCount}
        </Badge>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 bg-gray-50 rounded-b-lg p-3 overflow-y-auto max-h-[calc(100vh-280px)] transition-colors ${
          isOver ? 'bg-gray-100 ring-2 ring-blue-400' : ''
        }`}
      >
        <SortableContext
          items={itemIds}
          strategy={verticalListSortingStrategy}
        >
          {itemCount === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">
              {emptyMessage}
            </div>
          ) : (
            <div className="space-y-2">
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
                  ))
              }
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
};
