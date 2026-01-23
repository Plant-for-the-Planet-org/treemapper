'use client'

import React from 'react';
import {
  Trees,
  Leaf,
  Shield,
  Sprout,
  Calendar,
  MapPin,
  Activity,
  Target,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Card, CardContent, Badge } from './ui';
import { FlagTooltip } from './FlagTooltip';
import { LucideIcon } from 'lucide-react';

// Intervention Type Icons mapping
export const interventionTypeIcons: Record<string, LucideIcon> = {
  'enrichment-planting': Trees,
  'direct-seeding': Sprout,
  'removal-invasive-species': Shield,
  'maintenance': Activity,
  'fencing': Shield,
  'fire-patrol': Shield,
  'soil-improvement': Leaf,
  'grass-suppression': Leaf,
  'single-tree-registration': Trees,
  'multi-tree-registration': Trees,
  'other-intervention': Target
};

interface Species {
  speciesName?: string;
  otherSpeciesName?: string;
  scientificSpeciesUid?: string;
  count: number;
  uid?: string;
}

interface Site {
  name: string;
  status?: string;
}

interface FlagReason {
  title: string;
  level: string;
  message: string;
  createdAt: string;
}

interface Intervention {
  id: string | number;
  uid: string;
  hid: string;
  type: string;
  captureStatus: string;
  registrationDate: string;
  flag?: boolean;
  flagReason?: FlagReason[];
  hasRecords?: boolean;
  site?: Site;
  treeCount: number;
  species?: Species[];
}

interface InterventionCardProps {
  intervention: Intervention;
  isSelected: boolean;
  onClick: () => void;
}

export const InterventionCard = ({ intervention, isSelected, onClick }: InterventionCardProps) => {
  const IconComponent = interventionTypeIcons[intervention.type] || Target;

  const getCaptureStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'outline' => {
    switch (status) {
      case 'complete': return 'success';
      case 'partial': return 'warning';
      case 'incomplete': return 'error';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300 ${isSelected ? 'ring-2 ring-[#007A49] bg-[#007A49]/5 border-[#007A49]' : ''
        }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`relative p-2.5 rounded-lg transition-all duration-200 ${isSelected ? 'bg-[#007A49] text-white' : 'bg-gray-100 text-gray-600'
            }`}>
            <IconComponent className="h-4 w-4" />
            {intervention.flag && (
              <FlagTooltip flagReasons={intervention.flagReason}>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-2 h-2 text-white" />
                </div>
              </FlagTooltip>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-gray-900 text-sm leading-5">
                {intervention.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <div className="flex flex-col gap-1 ml-2">
                <Badge variant={getCaptureStatusVariant(intervention.captureStatus)}>
                  {intervention.captureStatus}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span>{formatDate(intervention.registrationDate)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                  {intervention.hid}
                </span>
                {intervention.hasRecords && (
                  <FileText className="h-3 w-3 text-blue-500" title="Has Records" />
                )}
              </div>

              {intervention.site && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span className="truncate">{intervention.site.name}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-gray-500">
                <span className="flex items-center gap-1">
                  <Trees className="h-3 w-3" />
                  <span className="font-medium">{intervention.treeCount}</span>
                  <span>trees</span>
                </span>
                {intervention.species && intervention.species.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Leaf className="h-3 w-3" />
                    <span className="font-medium">{intervention.species.length}</span>
                    <span>species</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
