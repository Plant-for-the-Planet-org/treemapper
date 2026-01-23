'use client'

import React from 'react';
import { Leaf } from 'lucide-react';
import { Card, CardContent } from './ui';

interface Species {
  speciesName?: string;
  otherSpeciesName?: string;
  scientificSpeciesUid?: string;
  count: number;
  uid?: string;
}

interface SpeciesCardProps {
  species: Species;
  setEditSpecies?: (species: Species) => void;
  editSpecies?: Species | null;
}

export const SpeciesCard = ({ species }: SpeciesCardProps) => {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#007A49] rounded-md flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-gray-900 text-sm leading-5">
                {species.speciesName || species.otherSpeciesName || 'Unknown Species'}
              </h4>
              {species.scientificSpeciesUid && (
                <span className="text-xs text-gray-500">ID: {species.scientificSpeciesUid}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-[#007A49]">{species.count}</div>
            <div className="text-xs text-gray-500">planted</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
