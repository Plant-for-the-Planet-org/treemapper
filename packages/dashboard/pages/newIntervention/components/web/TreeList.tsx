import React, { useState } from 'react';
import {
  List,
  Grid,
  SlidersHorizontal,
  Filter,
  Plus,
  ChevronDown,
  ChevronUp,
  Building
} from 'lucide-react';

// Import intervention icons
import {
  Leaf, // single-tree
  Trees, // multi-tree
  Scissors, // invasive species
  Flame, // fire suppression 
  Shield, // fire patrol
  Square, // fencing
  Flag, // marking regenerant
  Sparkles, // liberating regenerant
  CloudSun, // grass suppression
  Minus, // firebreaks
  Wind, // seed rain
  Mountain, // soil improvement
  Ban, // stop harvesting
  Sprout, // direct seeding
  TreePine, // enrichment planting
  Hammer, // maintenance
  HelpCircle // other intervention
} from 'lucide-react';

// Mapping of intervention types to icons and display names
const interventionTypeMap = {
  'single-tree-registration': {
    icon: Leaf,
    name: 'Single Tree Registration'
  },
  'multi-tree-registration': {
    icon: Trees,
    name: 'Multi Tree Registration'
  },
  'removal-invasive-species': {
    icon: Scissors,
    name: 'Removal of Invasive Species'
  },
  'fire-suppression': {
    icon: Flame,
    name: 'Fire Suppression'
  },
  'fire-patrol': {
    icon: Shield,
    name: 'Fire Patrol'
  },
  'fencing': {
    icon: Square,
    name: 'Fencing'
  },
  'marking-regenerant': {
    icon: Flag,
    name: 'Marking Regenerant'
  },
  'liberating-regenerant': {
    icon: Sparkles,
    name: 'Liberating Regenerant'
  },
  'grass-suppression': {
    icon: CloudSun,
    name: 'Grass Suppression'
  },
  'firebreaks': {
    icon: Minus,
    name: 'Firebreaks'
  },
  'assisting-seed-rain': {
    icon: Wind,
    name: 'Assisting Seed Rain'
  },
  'soil-improvement': {
    icon: Mountain,
    name: 'Soil Improvement'
  },
  'stop-tree-harvesting': {
    icon: Ban,
    name: 'Stop Tree Harvesting'
  },
  'direct-seeding': {
    icon: Sprout,
    name: 'Direct Seeding'
  },
  'enrichment-planting': {
    icon: TreePine,
    name: 'Enrichment Planting'
  },
  'maintenance': {
    icon: Hammer,
    name: 'Maintenance'
  },
  'other-intervention': {
    icon: HelpCircle,
    name: 'Other Intervention'
  }
};

const InterventionList = ({
  interventions,
  onSelectIntervention,
  selectedIntervention,
  sortOption,
  onSortChange,
  filterOption,
  onFilterChange,
  viewMode,
  onViewModeChange,
  sites = ['Site A', 'Site B', 'Site C', 'Site D'], // Default site list
  selectedSite = 'Site A',
  onSiteChange = () => { },
  onCreateIntervention = () => { }
}) => {
  // State for showing/hiding filters
  const [showFilters, setShowFilters] = useState(false);

  // Get all intervention types for filtering
  const interventionTypes = ['all', ...Object.keys(interventionTypeMap).map(key =>
    interventionTypeMap[key].name
  )];

  const renderInterventionIcon = (interventionType) => {
    const interventionInfo = Object.entries(interventionTypeMap).find(([key, value]) => key === interventionType);

    if (interventionInfo) {
      const [_, { icon: IconComponent }] = interventionInfo;
      return <IconComponent size={24} className="text-emerald-600" />;
    }

    return <HelpCircle size={24} className="text-gray-400" />;
  };

  const getInterventionName = (interventionType) => {
    return interventionTypeMap[interventionType]?.name || interventionType;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header with Create Button and Site Selector */}
      <div className="text-black-400 p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Interventions</h2>

        <div className="flex items-center gap-3">
          {/* Site Selector Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-emerald-700 px-3 py-2 rounded-md cursor-pointer" onClick={() => { }}>
              <Building size={16} color='white' />
              <select
                value={selectedSite}
                onChange={(e) => onSiteChange(e.target.value)}
                className="bg-transparent text-white border-none outline-none appearance-none cursor-pointer pr-6"
              >
                {sites.map(site => (
                  <option key={site} value={site} className="text-gray-800">{site}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-2" color='white' />
            </div>
          </div>

          {/* Create New Intervention Button */}
          <button
            onClick={onCreateIntervention}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-700 text-white hover:bg-emerald-700 transition-colors duration-200 shadow-md hover:shadow-lg font-semibold"
          >
            <Plus size={18} className="stroke-white" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="border-b border-gray-200">
        <div className="p-3 flex justify-between items-center">
          {/* Control Icons */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex border rounded-md overflow-hidden">
              <button
                className={`p-2 ${viewMode === 'list' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                onClick={() => onViewModeChange('list')}
                aria-label="List view"
              >
                <List size={16} />
              </button>
              <button
                className={`p-2 ${viewMode === 'grid' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                onClick={() => onViewModeChange('grid')}
                aria-label="Grid view"
              >
                <Grid size={16} />
              </button>
            </div>

            {/* Sort Icon */}
            <button
              className={`p-2 rounded-md ${showFilters ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Show filters"
            >
              <SlidersHorizontal size={16} />
            </button>

            {/* Filter Icon */}
            <button
              className={`p-2 rounded-md ${showFilters ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Show filters"
            >
              <Filter size={16} />
            </button>
          </div>

          {/* Toggle Filter Panel Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-emerald-600"
          >
            {showFilters ? (
              <>
                <span>Hide Filters</span>
                <ChevronUp size={16} />
              </>
            ) : (
              <>
                <span>Show Filters</span>
                <ChevronDown size={16} />
              </>
            )}
          </button>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="p-3 bg-gray-50 space-y-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal size={16} className="text-emerald-600" />
                <span className="text-sm font-medium">Sort by:</span>
              </div>
              <select
                value={sortOption}
                onChange={(e) => onSortChange(e.target.value)}
                className="border rounded-md p-1.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="date">Date</option>
                <option value="id">ID</option>
                <option value="type">Type</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-emerald-600" />
                <span className="text-sm font-medium">Filter by intervention:</span>
              </div>
              <select
                value={filterOption}
                onChange={(e) => onFilterChange(e.target.value)}
                className="border rounded-md p-1.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                {interventionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Intervention List */}
      <div className="overflow-y-auto flex-grow p-3 bg-gray-50">
        {viewMode === 'list' ? (
          <div className="space-y-2">
            {interventions.map(intervention => (
              <div
                key={intervention.id}
                onClick={() => onSelectIntervention(intervention)}
                className={`p-3 rounded-lg cursor-pointer transition-all transform hover:translate-y-[-2px] ${selectedIntervention?.id === intervention.id
                    ? 'bg-emerald-50 border-emerald-500 border shadow-md'
                    : 'bg-white hover:bg-gray-50 border border-gray-200 hover:shadow-sm'
                  }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${selectedIntervention?.id === intervention.id ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      {renderInterventionIcon(intervention.type)}
                    </div>
                    <div>
                      <div className="font-medium">{getInterventionName(intervention.type)}</div>
                      <div className="text-xs text-gray-500 mt-1">HID: {intervention.id}</div>
                    </div>
                  </div>
                  <div className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                    {new Date(intervention.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {interventions.map(intervention => (
              <div
                key={intervention.id}
                onClick={() => onSelectIntervention(intervention)}
                className={`p-4 rounded-lg cursor-pointer transition-all transform hover:translate-y-[-2px] flex flex-col items-center justify-center ${selectedIntervention?.id === intervention.id
                    ? 'bg-emerald-50 border-emerald-500 border shadow-md'
                    : 'bg-white hover:bg-gray-50 border border-gray-200 hover:shadow-sm'
                  }`}
              >
                <div className={`p-3 mb-3 rounded-full ${selectedIntervention?.id === intervention.id ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                  {renderInterventionIcon(intervention.type)}
                </div>
                <div className="font-medium text-center text-sm">{getInterventionName(intervention.type)}</div>
                <div className="text-xs text-gray-500 mt-2">HID: {intervention.id}</div>
                <div className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md mt-2">
                  {new Date(intervention.date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {interventions.length === 0 && (
          <div className="text-center p-8 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300 my-4">
            <HelpCircle size={32} className="mx-auto text-gray-400 mb-2" />
            <p>No interventions found matching the current filters.</p>
            <button
              onClick={onCreateIntervention}
              className="mt-3 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              Create your first intervention
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterventionList;