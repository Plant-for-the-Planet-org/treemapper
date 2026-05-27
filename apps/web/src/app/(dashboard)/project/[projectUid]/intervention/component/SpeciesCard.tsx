'use client'

import React from 'react';
import { Leaf, Pen } from 'lucide-react';
import { Card, CardContent } from './ui';

interface Species {
  uid?: string;
  speciesName?: string;
  commonName?: string;
  otherSpeciesName?: string;
  scientificSpeciesUid?: string;
  scientificSpeciesId?: number;
  count: number;
  isUnknown?: boolean;
}

interface SpeciesCardProps {
  species: Species;
  setEditSpecies?: (species: Species) => void;
  editSpecies?: Species | null;
  canEdit?: boolean;
}

export const SpeciesCard = ({ species, setEditSpecies, canEdit }: SpeciesCardProps) => {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 bg-[#007A49] rounded-md flex items-center justify-center shrink-0">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-gray-900 text-sm leading-5 truncate">
                {species.isUnknown
                  ? 'Unknown Species'
                  : species.speciesName || species.otherSpeciesName || 'Unknown Species'}
              </h4>
              {!species.isUnknown && species.commonName && (
                <span className="text-xs text-gray-500 truncate">{species.commonName}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <div className="text-right">
              <div className="text-lg font-semibold text-[#007A49]">{species.count}</div>
              <div className="text-xs text-gray-500">planted</div>
            </div>
            {canEdit && setEditSpecies && (
              <button
                onClick={() => setEditSpecies(species)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                title="Edit species"
              >
                <Pen className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
