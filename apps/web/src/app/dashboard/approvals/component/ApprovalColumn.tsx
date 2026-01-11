'use client';

import React from 'react';
import { ApprovalBoardColumn } from '@shared-core/types/approval.types';
import { ApprovalCard } from './ApprovalCard';
import { Badge } from '@/components/ui/badge';

interface ApprovalColumnProps {
  column: ApprovalBoardColumn;
  onCardClick: (interventionId: number) => void;
}

export const ApprovalColumn: React.FC<ApprovalColumnProps> = ({
  column,
  onCardClick,
}) => {
  return (
    <div className="flex flex-col h-full min-w-[320px] max-w-[320px]">
      <div
        className="flex items-center justify-between px-4 py-3 rounded-t-lg"
        style={{ backgroundColor: column.color }}
      >
        <h3 className="text-sm font-bold text-white">{column.title}</h3>
        <Badge
          className={`${column.badgeColor} text-white`}
          style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
        >
          {column.interventions.length}
        </Badge>
      </div>

      <div className="flex-1 bg-gray-50 rounded-b-lg p-3 overflow-y-auto max-h-[calc(100vh-280px)]">
        {column.interventions.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-gray-400">
            No interventions
          </div>
        ) : (
          <div className="space-y-2">
            {column.interventions.map((intervention) => (
              <ApprovalCard
                key={intervention.interventionId}
                intervention={intervention}
                onClick={() => onCardClick(intervention.interventionId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
