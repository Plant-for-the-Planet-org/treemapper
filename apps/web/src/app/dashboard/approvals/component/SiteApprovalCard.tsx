'use client';

import React from 'react';
import { SiteApprovalData } from '@shared-core/types/approval.types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, TreesIcon, User } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';

interface SiteApprovalCardProps {
  site: SiteApprovalData;
  onClick: () => void;
  isDragging?: boolean;
}

export const SiteApprovalCard: React.FC<SiteApprovalCardProps> = ({
  site,
  onClick,
  isDragging = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: site.siteId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatType = (type: string) => {
    return type
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return date;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planted: 'bg-green-100 text-green-800 border-green-200',
      planting: 'bg-blue-100 text-blue-800 border-blue-200',
      barren: 'bg-gray-100 text-gray-800 border-gray-200',
      reforestation: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      planning: 'bg-amber-100 text-amber-800 border-amber-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-4 mb-3 cursor-pointer hover:shadow-md transition-all ${
        isDragging || isSortableDragging ? 'opacity-50 scale-105' : ''
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {site.projectName && (
            <div className="text-xs text-gray-400 truncate mb-0.5">{site.projectName}</div>
          )}
          <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
            {site.name}
          </h4>
          <p className="text-xs text-gray-500 mt-1">{site.siteUid}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-3">
        <Badge className={`text-xs ${getStatusColor(site.siteData.status)}`} variant="outline">
          {formatType(site.siteData.status)}
        </Badge>
      </div>

      {/* Description */}
      {site.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {site.description}
        </p>
      )}

      {/* Site Details */}
      <div className="space-y-2 text-xs">
        {/* Area */}
        {site.siteData.area && (
          <div className="flex items-center text-gray-700">
            <MapPin className="h-3 w-3 mr-1.5 text-gray-400" />
            <span>{(site.siteData.area / 10000).toFixed(2)} hectares</span>
          </div>
        )}

        {/* Expected Tree Count */}
        {site.siteData.expectedTreeCount && (
          <div className="flex items-center text-gray-700">
            <TreesIcon className="h-3 w-3 mr-1.5 text-gray-400" />
            <span>{site.siteData.expectedTreeCount.toLocaleString()} trees planned</span>
          </div>
        )}

        {/* Created By */}
        <div className="flex items-center text-gray-700">
          <User className="h-3 w-3 mr-1.5 text-gray-400" />
          <span>{site.createdBy.name}</span>
        </div>

        {/* Planting Date */}
        {site.siteData.plannedPlantingDate && (
          <div className="flex items-center text-gray-700">
            <Calendar className="h-3 w-3 mr-1.5 text-gray-400" />
            <span>Planned: {formatDate(site.siteData.plannedPlantingDate)}</span>
          </div>
        )}
      </div>

      {/* Footer - Comments count */}
      {site.comments.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {site.comments.length} comment{site.comments.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </Card>
  );
};
