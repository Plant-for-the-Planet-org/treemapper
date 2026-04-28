'use client';

import React from 'react';
import { InterventionApprovalData } from '@shared-core/types/approval.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, ImageIcon, User, Calendar, Pencil } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouter } from 'next/navigation';

interface ApprovalCardProps {
  intervention: InterventionApprovalData;
  onClick: () => void;
  isDragging?: boolean;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  intervention,
  onClick,
  isDragging = false,
}) => {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: intervention.interventionId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatType = (type: string) => {
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getTimeAgo = (date: string | null) => {
    if (!date) return '';
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const commentsCount = intervention.comments?.length || 0;
  const hasImage = intervention.interventionData?.image;
  const sampleTreeCount = intervention.interventionData?.totalSampleTreeCount ?? intervention.interventionData?.sampleTrees?.length ?? 0;
  const uniqueSpecies = intervention.interventionData?.speciesCount
    ?? (intervention.interventionData?.sampleTrees
      ? [...new Set(intervention.interventionData.sampleTrees.map((t) => t.species).filter(Boolean))].length
      : 0);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-4 mb-3 cursor-pointer hover:shadow-md transition-all duration-200 ${
        isDragging || isSortableDragging ? 'opacity-50 scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-[#007A49]">
              #{intervention.interventionHid}
            </span>
            {hasImage && (
              <Badge variant="secondary" className="h-5 px-1.5">
                <ImageIcon className="h-3 w-3" />
              </Badge>
            )}
          </div>
          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">
            {formatType(intervention.type)}
          </h4>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-600 mb-3 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="font-medium">🌳</span>
          <span>{intervention.interventionData?.totalTreeCount || 0} trees</span>
        </div>
        {sampleTreeCount > 0 && (
          <div className="flex items-center gap-1">
            <span className="font-medium">🔬</span>
            <span>{sampleTreeCount} samples</span>
          </div>
        )}
        {uniqueSpecies > 0 && (
          <div className="flex items-center gap-1">
            <span className="font-medium">🌿</span>
            <span>{uniqueSpecies} {uniqueSpecies === 1 ? 'species' : 'species'}</span>
          </div>
        )}
        {intervention.interventionData?.area && (
          <div className="flex items-center gap-1">
            <span className="font-medium">📏</span>
            <span>{intervention.interventionData.area.toFixed(0)} m²</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-gray-600">
          <User className="h-3 w-3" />
          <span className="truncate max-w-[120px]">
            {intervention.createdBy.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {commentsCount > 0 && (
            <Badge variant="outline" className="h-5 px-1.5">
              <MessageSquare className="h-3 w-3 mr-1" />
              {commentsCount}
            </Badge>
          )}
        </div>
      </div>

      {intervention.submittedForReviewAt && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
          <Calendar className="h-3 w-3" />
          <span>{getTimeAgo(intervention.submittedForReviewAt)}</span>
        </div>
      )}

      {intervention.approvedBy && (
        <Badge className="mt-2 bg-green-50 text-green-700 border-green-200">
          ✓ {intervention.approvedBy.name}
        </Badge>
      )}

      {intervention.reviewStatus === 'in_review' && (
        <Button
          size="sm"
          variant="outline"
          className="mt-3 w-full h-7 text-xs border-[#007A49] text-[#007A49] hover:bg-[#007A49] hover:text-white"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/dashboard/intervention?id=${intervention.interventionUid}`);
          }}
        >
          <Pencil className="h-3 w-3 mr-1" />
          Edit
        </Button>
      )}
    </Card>
  );
};
