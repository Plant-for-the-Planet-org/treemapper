'use client'

import React, { useState } from 'react';
import { Search, Filter, ChevronDown, Upload, Plus, Menu } from 'lucide-react';
import { Button, Input } from './ui';
import { FiltersSection } from './FiltersSection';

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

interface HeaderWithFiltersProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  interventionTypes: string[];
  sites: Site[];
  handleDateChange: (date: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  newIntervention: () => void;
  userRole?: string;
  bulkUpload: () => void;
  error?: string | null;
  loading?: boolean;
  handleFilterChange?: (filterKey: string, value: string) => void;
  clearAllFilters?: () => void;
  activeFilterCount?: number;
}

export const HeaderWithFilters = ({
  filters,
  setFilters,
  searchTerm,
  setSearchTerm,
  interventionTypes,
  sites,
  handleDateChange,
  sidebarCollapsed,
  setSidebarCollapsed,
  newIntervention,
  userRole,
  bulkUpload,
}: HeaderWithFiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0">
      <div className="space-y-4">
        {/* Header Top Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Desktop Actions */}
          <div className="flex items-center gap-3">
            <div className="relative" style={{ position: 'absolute', left: 20, width: "20vw" }}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by HID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className="hidden lg:flex"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>

            {userRole !== 'contributor' && (
              <Button variant="outline" onClick={bulkUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
            )}

            <Button onClick={newIntervention}>
              <Plus className="h-4 w-4 mr-2" />
              New Intervention
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="border-t border-gray-100 pt-4">
            <FiltersSection
              filters={filters}
              setFilters={setFilters}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              interventionTypes={interventionTypes}
              sites={sites}
              onDateChange={handleDateChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};
