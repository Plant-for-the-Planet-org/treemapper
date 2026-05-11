'use client'

import React from 'react';
import { Select, Input } from './ui';

interface Site {
  id: string | number;
  name: string;
}

interface Filters {
  type: string;
  captureMode: string;
  projectSiteId: string;
  interventionStartDate: string;
  registrationDate: string;
  userId: string;
  species: string[];
  flag: string;
  sortOrder: string;
}

interface FiltersSectionProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  interventionTypes: string[];
  sites: Site[];
  onDateChange: (date: string) => void;
}

const DEFAULT_FILTERS: Filters = {
  type: '',
  captureMode: '',
  projectSiteId: '',
  interventionStartDate: '',
  registrationDate: '',
  userId: '',
  species: [],
  flag: '',
  sortOrder: '',
};

export const FiltersSection = ({
  filters,
  setFilters,
  searchTerm,
  setSearchTerm,
  interventionTypes,
  sites,
  onDateChange
}: FiltersSectionProps) => {
  const hasActiveFilters =
    filters.type !== '' ||
    filters.captureMode !== '' ||
    filters.projectSiteId !== '' ||
    filters.interventionStartDate !== '' ||
    filters.flag !== '' ||
    searchTerm !== '';

  const clearAll = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchTerm('');
    onDateChange('');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <Select
          value={filters.type}
          onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
          placeholder="All Types"
        >
          {interventionTypes.map(type => (
            <option key={type} value={type}>
              {type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </Select>

        <Select
          value={filters.captureMode}
          onValueChange={(value) => setFilters(prev => ({ ...prev, captureMode: value }))}
          placeholder="All Capture Modes"
        >
          <option value="on-site">On Site</option>
          <option value="off-site">Off Site</option>
          <option value="external">External</option>
          <option value="unknown">Unknown</option>
        </Select>

        <Select
          value={filters.projectSiteId}
          onValueChange={(value) => setFilters(prev => ({ ...prev, projectSiteId: value }))}
          placeholder="All Sites"
        >
          {sites.map(site => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </Select>

        <Input
          type="date"
          value={filters.interventionStartDate}
          onChange={(e) => onDateChange(e.target.value)}
          placeholder="Filter by date"
        />

        <Select
          value={filters.flag}
          onValueChange={(value) => setFilters(prev => ({ ...prev, flag: value }))}
          placeholder="All Items"
        >
          <option value="true">Flagged Only</option>
          <option value="false">Not Flagged</option>
        </Select>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={clearAll}
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};
