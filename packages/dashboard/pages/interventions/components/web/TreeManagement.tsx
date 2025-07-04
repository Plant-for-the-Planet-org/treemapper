import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Trees,
  Leaf,
  Shield,
  Sprout,
  Calendar,
  User,
  MapPin,
  Filter,
  ChevronDown,
  Eye,
  Activity,
  Clock,
  Target,
  Camera,
  Info,
  Layers,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Search,
  ChevronUp,
  Ruler,
  Heart,
  AlertTriangle,
  TrendingUp,
  Microscope,
  Tag,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Expand,
  Shrink,
  Upload,
  TreePine,
  Flag,
  CheckCircle,
  AlertCircle,
  FileText,
  Database,
  Loader
} from 'lucide-react';
import MapDisplayComponent from './ProjectSelectMap';
import { useToken } from '../../../../context/TokenContext';
import { getProjectIntervention } from '../../../../api/api.fetch';
import useProjectStore from '../../../../store/useProjectStore';
import Image from 'next/image'


const interventionTypeIcons = {
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

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

const InterventionSkeleton = () => (
  <div className="p-5 border-b border-slate-100/80 animate-pulse">
    <div className="flex items-start space-x-4">
      <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <div className="w-32 h-4 bg-slate-200 rounded"></div>
          <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
        </div>
        <div className="w-24 h-3 bg-slate-200 rounded"></div>
        <div className="flex items-center justify-between">
          <div className="w-20 h-4 bg-slate-200 rounded"></div>
          <div className="w-14 h-4 bg-slate-200 rounded-full"></div>
        </div>
        <div className="w-full h-3 bg-slate-200 rounded"></div>
        <div className="flex space-x-8">
          <div className="w-20 h-3 bg-slate-200 rounded"></div>
          <div className="w-16 h-3 bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

const DetailsSkeleton = () => (
  <div className="animate-pulse">
    <div className="p-6 border-b border-slate-200/60">
      <div className="flex items-center justify-between">
        <div>
          <div className="w-48 h-6 bg-slate-200 rounded mb-2"></div>
          <div className="w-24 h-4 bg-slate-200 rounded"></div>
        </div>
        <div className="flex space-x-2">
          <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
          <div className="w-20 h-6 bg-slate-200 rounded-full"></div>
        </div>
      </div>
    </div>
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-100 rounded-xl p-4">
            <div className="w-8 h-8 bg-slate-200 rounded mb-2"></div>
            <div className="w-16 h-6 bg-slate-200 rounded mb-1"></div>
            <div className="w-12 h-4 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ============================================================================
// TOOLTIP COMPONENT
// ============================================================================

const TreeTooltip = ({ tree, isVisible, position }) => {
  if (!isVisible || !tree) return null;

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-slate-200 p-4 max-w-sm"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: 'translateY(-100%)'
      }}
    >
      {tree.image && <div className="relative w-full h-32 mb-3 bg-gray-100 rounded-md overflow-hidden">
        <Image
          src={`https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/development/tree/${tree.image}`}
          alt="Tree image"
          fill
          className="object-cover"
        />
      </div>}


      <div className="flex items-center space-x-2 mb-3">
        <Trees className="w-4 h-4 text-green-600" />
        <span className="font-semibold text-slate-800">{tree.tag || tree.hid}</span>
        <span className={`px-2 py-1 rounded-full text-xs ${tree.status === 'alive' ? 'bg-green-100 text-green-700' :
          tree.status === 'dead' ? 'bg-red-100 text-red-700' :
            'bg-slate-100 text-slate-700'
          }`}>
          {tree.status}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        {tree.speciesName && (
          <div className="flex justify-between">
            <span className="text-slate-600">Species:</span>
            <span className="font-medium">{tree.speciesName}</span>
          </div>
        )}
        {tree.height && (
          <div className="flex justify-between">
            <span className="text-slate-600">Height:</span>
            <span className="font-medium">{tree.height}m</span>
          </div>
        )}
        {tree.width && (
          <div className="flex justify-between">
            <span className="text-slate-600">Width:</span>
            <span className="font-medium">{tree.width}m</span>
          </div>
        )}
        {tree.plantingDate && (
          <div className="flex justify-between">
            <span className="text-slate-600">Planted:</span>
            <span className="font-medium">
              {new Date(tree.plantingDate).toLocaleDateString()}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-slate-600">Type:</span>
          <span className="font-medium capitalize">{tree.treeType}</span>
        </div>
        {tree.records && tree.records.length > 0 && (
          <div className="border-t pt-2 mt-2">
            <span className="text-slate-600 text-xs">Records: {tree.records.length}</span>
            <div className="mt-1 text-xs text-slate-500">
              Last: {new Date(tree.records[0]?.recordedAt).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const HeaderWithFilters = ({
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
  error
}) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-4 sm:px-6 py-3 shadow-sm" style={{ paddingTop: '7vh' }}>
      <div className="flex flex-col gap-4">
        {/* Header Top Row */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Title and Mobile Actions */}
          <div className="flex items-start sm:items-center justify-between lg:justify-start gap-4 pt-2">
            <div className="flex items-start sm:items-center space-x-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Menu className="h-5 w-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl xl:text-3xl font-bold text-slate-800 tracking-tight">
                  Project Interventions
                </h1>
                {error && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {error}
                  </p>
                )}
              </div>
            </div>

            {/* Mobile Buttons */}
            <div className="flex lg:hidden items-center space-x-2">
              <button className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all">
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={newIntervention}
                className="p-2 bg-gradient-to-r from-[#007A49] to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition-all"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center text-sm font-medium text-[#007A49] hover:underline"
              >
                {showFilters ? (
                  <>
                    Hide Filters <ChevronUp className="ml-1 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show Filters <ChevronDown className="ml-1 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
            {userRole !== 'contributor' && <button
              onClick={bulkUpload}
              className="flex items-center px-4 py-2 bg-white/90 border border-slate-200 text-slate-700 rounded-xl hover:bg-white hover:shadow-md transition-all font-medium"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </button>}
            <button
              onClick={newIntervention}
              className="flex items-center px-6 py-2 bg-gradient-to-r from-[#007A49] to-green-700 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Intervention
            </button>
          </div>
        </div>

        {/* Toggle Filters Button */}


        {/* Filters (conditionally shown) */}
        {showFilters && (
          <div className="animate-fadeIn">
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

// ============================================================================
// FILTERS COMPONENT
// ============================================================================

const FiltersSection = ({
  filters,
  setFilters,
  searchTerm,
  setSearchTerm,
  interventionTypes,
  sites,
  onDateChange
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Top Row - Search */}
      <div className="w-full flex justify-between items-center flex-wrap gap-4">
        <div className="relative w-full lg:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by HID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/90 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#007A49]/50 focus:border-[#007A49]/30"
          />
        </div>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Type Filter */}
        <select
          value={filters.type}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          className="w-full appearance-none bg-white/90 border border-slate-200 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007A49]/50"
        >
          <option value="">All Types</option>
          {interventionTypes.map(type => (
            <option key={type} value={type}>
              {type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>

        {/* Capture Mode Filter */}
        <select
          value={filters.captureMode}
          onChange={(e) => setFilters(prev => ({ ...prev, captureMode: e.target.value }))}
          className="w-full appearance-none bg-white/90 border border-slate-200 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007A49]/50"
        >
          <option value="">All Capture Modes</option>
          <option value="on-site">On Site</option>
          <option value="off-site">Off Site</option>
          <option value="external">External</option>
          <option value="unknown">Unknown</option>
        </select>

        {/* Site Filter */}
        <select
          value={filters.projectSiteId}
          onChange={(e) => setFilters(prev => ({ ...prev, projectSiteId: e.target.value }))}
          className="w-full appearance-none bg-white/90 border border-slate-200 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007A49]/50"
        >
          <option value="">All Sites</option>
          {sites.map(site => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>

        {/* Date Filter */}
        <input
          type="date"
          value={filters.interventionStartDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full bg-white/90 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007A49]/50"
        />

        {/* Flag Filter */}
        <select
          value={filters.flag}
          onChange={(e) => setFilters(prev => ({ ...prev, flag: e.target.value }))}
          className="w-full appearance-none bg-white/90 border border-slate-200 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007A49]/50"
        >
          <option value="">All Items</option>
          <option value="true">Flagged Only</option>
          <option value="false">Not Flagged</option>
        </select>
      </div>
    </div>
  );
};


// ============================================================================
// INTERVENTION CARD COMPONENT
// ============================================================================

const InterventionCard = ({ intervention, isSelected, onClick }) => {
  const IconComponent = interventionTypeIcons[intervention.type] || Target;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'planned': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'failed': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'on-hold': return 'bg-slate-50 text-slate-700 border-slate-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getCaptureStatusColor = (status) => {
    switch (status) {
      case 'complete': return 'bg-green-50 text-green-700 border-green-200';
      case 'partial': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'incomplete': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatInterventionType = (type) => {
    return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div
      onClick={onClick}
      className={`p-5 border-b border-slate-100/80 cursor-pointer transition-all duration-200 hover:bg-white/80 hover:shadow-sm group
        ${isSelected ? 'bg-gradient-to-r from-[#007A49]/5 to-white border-l-4 border-l-[#007A49] shadow-sm' : ''}`}
    >
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-xl transition-all duration-200 group-hover:scale-105 flex-shrink-0 relative
          ${isSelected ? 'bg-gradient-to-br from-[#007A49] to-green-600 shadow-lg shadow-[#007A49]/20' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
          <IconComponent className={`h-5 w-5 transition-colors ${isSelected ? 'text-white' : 'text-slate-600'}`} />
          {intervention.flag && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <Flag className="w-2 h-2 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-semibold text-slate-800 truncate leading-tight">
                {formatInterventionType(intervention.type)}
              </h3>
              {intervention.hasRecords && (
                <FileText className="w-4 h-4 text-blue-500" title="Has Records" />
              )}
            </div>
            <div className="flex flex-col items-end space-y-1">
              <span className={`text-xs px-3 py-1 rounded-full border font-medium whitespace-nowrap ${getStatusColor(intervention.interventionStatus)}`}>
                {intervention.interventionStatus}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getCaptureStatusColor(intervention.captureStatus)}`}>
                {intervention.captureStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center text-sm text-slate-600 mb-2">
            <Calendar className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
            <span className="truncate">{formatDate(intervention.registrationDate)}</span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
              {intervention.hid}
            </span>
          </div>

          {intervention.flag && intervention.flagReason && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-1 mb-1">
                <AlertTriangle className="w-3 h-3 text-red-600" />
                <span className="text-xs font-medium text-red-700">Flagged</span>
              </div>
              {intervention.flagReason.map((reason, idx) => (
                <div key={idx} className="text-xs text-red-600">
                  {reason.title}: {reason.message}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 text-xs text-slate-500">
            {intervention.site && (
              <span className="flex items-center">
                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{intervention.site.name}</span>
              </span>
            )}

            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <Trees className="h-3 w-3 mr-1 flex-shrink-0" />
                <span>{intervention.treeCount} trees</span>
              </span>
              {intervention.species?.length > 0 && (
                <span className="flex items-center">
                  <Leaf className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span>{intervention.species.length} species</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TREE CARD COMPONENT
// ============================================================================

const TreeCard = ({ tree, onMouseEnter, onMouseLeave }) => {
  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-[#007A49] rounded-lg flex items-center justify-center">
            <Trees className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800">{tree.tag || tree.hid}</h4>
            <span className="text-xs text-slate-600">{tree.hid}</span>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${tree.status === 'alive' ? 'bg-green-100 text-green-700' :
          tree.status === 'dead' ? 'bg-red-100 text-red-700' :
            'bg-slate-100 text-slate-700'
          }`}>
          {tree.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {tree.speciesName && (
          <div className="col-span-2 flex items-center space-x-2">
            <Leaf className="w-4 h-4 text-slate-500" />
            <span className="text-slate-700 truncate">{tree.speciesName}</span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Tag className="w-4 h-4 text-slate-500" />
          <span className="text-slate-700 capitalize">{tree.treeType}</span>
        </div>
        {tree.height && (
          <div className="flex items-center space-x-2">
            <Ruler className="w-4 h-4 text-slate-500" />
            <span className="text-slate-700">{tree.height}m</span>
          </div>
        )}
        {tree.plantingDate && (
          <div className="col-span-2 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-slate-700">
              {new Date(tree.plantingDate).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {tree.records && tree.records.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">Records: {tree.records.length}</span>
            <span className="text-xs text-slate-500">
              Last: {new Date(tree.records[0]?.recordedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SPECIES CARD COMPONENT
// ============================================================================

const SpeciesCard = ({ species }) => (
  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-[#007A49] rounded-lg flex items-center justify-center">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-800">
            {species.speciesName || species.otherSpeciesName || 'Unknown Species'}
          </h4>
          {species.scientificSpeciesUid && typeof species.scientificSpeciesUid === 'string' && (
            <span className="text-sm text-slate-600">ID: {species.scientificSpeciesUid}</span>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-[#007A49]">{species.count}</div>
        <div className="text-xs text-slate-600">planted</div>
      </div>
    </div>

    <div className="flex items-center space-x-4 text-sm text-slate-600">
      <span>Unknown: {species.isUnknown ? 'Yes' : 'No'}</span>
      <span>Created: {new Date(species.createdAt).toLocaleDateString()}</span>
    </div>
  </div>
);

// ============================================================================
// INTERVENTION DETAILS COMPONENT
// ============================================================================

const InterventionDetails = ({
  intervention,
  hoveredTree,
  tooltipPosition,
  onTreeHover,
  onTreeLeave
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatInterventionType = (type) => {
    return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'planned': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'failed': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'on-hold': return 'bg-slate-50 text-slate-700 border-slate-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getCaptureStatusColor = (status) => {
    switch (status) {
      case 'complete': return 'bg-green-50 text-green-700 border-green-200';
      case 'partial': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'incomplete': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <>
      {/* Map Section */}
      <div className="flex-1 bg-white/60 backdrop-blur-sm m-6 mb-4 rounded-2xl border border-slate-200/60 relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-slate-50/50">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23007A49' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }}></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <MapDisplayComponent geoJSON={intervention.originalGeometry} />
        </div>
      </div>

      {/* Details Panel */}
      <div className="h-64 px-6 pb-6 overflow-y-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm">
          {/* Header */}
          <div className="p-6 border-b border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {formatInterventionType(intervention.type)}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-slate-600">ID: {intervention.hid}</p>
                  {intervention.flag && (
                    <div className="flex items-center space-x-1 text-red-600">
                      <Flag className="w-4 h-4" />
                      <span className="text-sm font-medium">Flagged</span>
                    </div>
                  )}
                  {intervention.hasRecords && (
                    <div className="flex items-center space-x-1 text-blue-600">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm font-medium">Has Records</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full border font-medium text-sm ${getStatusColor(intervention.interventionStatus)}`}>
                  {intervention.interventionStatus}
                </span>
                <span className={`px-3 py-1 rounded-full border font-medium text-sm ${getCaptureStatusColor(intervention.captureStatus)}`}>
                  {intervention.captureStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Flag Reasons */}
            {intervention.flag && intervention.flagReason && intervention.flagReason.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Flag Reasons
                </h3>
                <div className="space-y-2">
                  {intervention.flagReason.map((reason, index) => (
                    <div key={index} className="bg-white rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-red-700">{reason.title}</span>
                        <span className="text-xs text-red-600 capitalize">{reason.level}</span>
                      </div>
                      <p className="text-sm text-red-600">{reason.message}</p>
                      <div className="text-xs text-red-500 mt-1">
                        Created: {new Date(reason.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <Trees className="w-8 h-8 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-900">{intervention.treeCount}</span>
                </div>
                <p className="text-blue-700 font-medium">Trees</p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <Leaf className="w-8 h-8 text-green-600" />
                  <span className="text-2xl font-bold text-green-900">{intervention.species?.length || 0}</span>
                </div>
                <p className="text-green-700 font-medium">Species</p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <TreePine className="w-8 h-8 text-purple-600" />
                  <span className="text-2xl font-bold text-purple-900">{intervention.trees?.length || 0}</span>
                </div>
                <p className="text-purple-700 font-medium">Sample Trees</p>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <CalendarIcon className="w-8 h-8 text-orange-600" />
                  <span className="text-lg font-bold text-orange-900">
                    {formatDate(intervention.updatedAt)}
                  </span>
                </div>
                <p className="text-orange-700 font-medium">Last Update</p>
              </div>
            </div>

            {/* Species Section */}
            {intervention.species?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <Leaf className="w-5 h-5 mr-2 text-[#007A49]" />
                  Species Planted
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {intervention.species.map((species, index) => (
                    <SpeciesCard key={species.uid || index} species={species} />
                  ))}
                </div>
              </div>
            )}

            {/* Trees Section */}
            {intervention.trees?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <Trees className="w-5 h-5 mr-2 text-[#007A49]" />
                  Individual Trees ({intervention.trees.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {intervention.trees.map((tree) => (
                    <TreeCard
                      key={tree.id}
                      tree={tree}
                      onMouseEnter={(e) => onTreeHover(tree, e)}
                      onMouseLeave={onTreeLeave}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  Intervention Details
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Registration Date:</span>
                    <span className="font-medium">{formatDate(intervention.registrationDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Start Date:</span>
                    <span className="font-medium">{formatDate(intervention.interventionStartDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">End Date:</span>
                    <span className="font-medium">{formatDate(intervention.interventionEndDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Capture Mode:</span>
                    <span className="font-medium capitalize">{intervention.captureMode?.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sample Tree Count:</span>
                    <span className="font-medium">{intervention.sampleTreeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Privacy:</span>
                    <span className="font-medium">{intervention.isPrivate ? 'Private' : 'Public'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Location & Site
                </h4>
                <div className="space-y-3 text-sm">
                  {intervention.site && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Site:</span>
                        <span className="font-medium">{intervention.site.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Site Status:</span>
                        <span className="font-medium capitalize">{intervention.site.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Site Description:</span>
                        <span className="font-medium">{intervention.site.description || 'N/A'}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Created:</span>
                    <span className="font-medium">{formatDate(intervention.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Last Updated:</span>
                    <span className="font-medium">{formatDate(intervention.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata Section */}
            {intervention.metadata && (
              <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                  <Database className="w-4 h-4 mr-2" />
                  Metadata
                </h4>
                <div className="bg-slate-50 rounded-xl p-4">
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap">
                    {JSON.stringify(intervention.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tree Tooltip */}
      <TreeTooltip
        tree={hoveredTree}
        isVisible={!!hoveredTree}
        position={tooltipPosition}
      />
    </>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TreeMapperUI = ({ newIntervention, bulkUpload }) => {
  const [interventions, setInterventions] = useState([]);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    captureMode: '',
    projectSiteId: '',
    interventionStartDate: '',
    flag: ''
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [hasMore, setHasMore] = useState(true);
  const [sites, setSites] = useState([]);
  const [hoveredTree, setHoveredTree] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const { accessToken } = useToken();
  const selectedProject = useProjectStore(state => state.selectedProject);
  const observerRef = useRef();

  // Get unique intervention types
  const interventionTypes = useMemo(() => {
    return [...new Set(interventions.map(i => i.type))];
  }, [interventions]);

  // Fetch interventions data
  const fetchInterventionData = async (page = 1, append = false) => {
    if (!selectedProject?.uid) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = {
        page,
        limit: pagination.limit,
        ...filters,
        searchHid: searchTerm
      };

      // Remove empty filters
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });

      const response = await getProjectIntervention(accessToken || '', selectedProject.uid, queryParams);

      if (response && response.statusCode === 200) {
        const newInterventions = response.data.intervention || [];

        if (append) {
          setInterventions(prev => [...prev, ...newInterventions]);
        } else {
          setInterventions(newInterventions);
          // Reset selected intervention if it's not in the new results
          // if (selectedIntervention && !newInterventions.find(i => i.id === selectedIntervention.id)) {
          //   setSelectedIntervention(null);
          // }
          if (!selectedIntervention && newInterventions.length > 0) {
            setSelectedIntervention(newInterventions[0]);
          }
        }

        const newPagination = response.data.pagination;
        setPagination(newPagination);
        setHasMore(newPagination.page < newPagination.totalPages);
      } else {
        throw new Error('Failed to fetch interventions');
      }
    } catch (error) {
      console.error('Error fetching interventions:', error);
      setError(error.message || 'Failed to fetch interventions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch sites data (you'll need to implement this API call)
  const fetchSites = async () => {
    try {
      // Replace with your actual API call
      // const response = await getProjectSites(accessToken, selectedProject.uid);
      // setSites(response.data || []);

      // Mock data for now
      setSites([
        { id: 1, name: "L1a Rainforest" },
        { id: 2, name: "Northern Forest" },
        { id: 3, name: "Southern Meadow" }
      ]);
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  // Load more interventions (infinite scroll)
  const loadMoreInterventions = useCallback(async () => {
    if (loading || !hasMore) return;

    const nextPage = pagination.page + 1;
    await fetchInterventionData(nextPage, true);
  }, [loading, hasMore, pagination.page, filters, searchTerm]);

  // Intersection observer for infinite scroll
  const lastInterventionElementRef = useCallback(node => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreInterventions();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, loadMoreInterventions]);

  // Tree hover handlers
  const handleTreeHover = (tree, event) => {
    setHoveredTree(tree);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleTreeLeave = () => {
    setHoveredTree(null);
  };

  // Date filter handler
  const handleDateChange = (date) => {
    setFilters(prev => ({ ...prev, interventionStartDate: date }));
  };

  // Effects
  useEffect(() => {
    if (selectedProject) {
      fetchInterventionData();
      fetchSites();
    }
  }, [selectedProject]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedProject) {
        fetchInterventionData();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters, searchTerm]);

  // Filter interventions (for display)
  const filteredInterventions = useMemo(() => {
    return interventions.sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));
  }, [interventions]);

  return (
    <div className="bg-gray-50 flex flex-col h-screen w-full">
      {/* Header */}
      <HeaderWithFilters
        filters={filters}
        setFilters={setFilters}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        interventionTypes={interventionTypes}
        sites={sites}
        newIntervention={newIntervention}
        bulkUpload={bulkUpload}
        userRole={selectedProject?.userRole}
        handleDateChange={handleDateChange} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} error={error} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Intervention List */}
        <div className={`${sidebarCollapsed ? 'w-0 lg:w-16' : 'w-full md:w-96 lg:w-96'} 
          bg-white/60 backdrop-blur-sm border-r border-slate-200/60 flex flex-col transition-all duration-300 ease-in-out relative mb-10`}>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex absolute -right-3 top-6 z-10 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
          >
            <ChevronLeft className={`h-3 w-3 text-slate-600 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>

          {!sidebarCollapsed && (
            <>
              <div className="p-6 border-b border-slate-200/60">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800">Interventions</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                      {filteredInterventions.length} of {pagination.total}
                    </span>
                    {loading && (
                      <Loader className="w-4 h-4 animate-spin text-[#007A49]" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredInterventions.length === 0 && !loading ? (
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Trees className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">
                      {error ? 'Error Loading Interventions' : 'No Interventions Found'}
                    </h3>
                    <p className="text-slate-600 text-sm">
                      {error ? 'Please try again later.' : 'Try adjusting your search or filters.'}
                    </p>
                    {error && (
                      <button
                        onClick={() => fetchInterventionData()}
                        className="mt-3 px-4 py-2 bg-[#007A49] text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {filteredInterventions.map((intervention, index) => {
                      const isLast = index === filteredInterventions.length - 1;
                      return (
                        <div
                          key={intervention.id}
                          ref={isLast ? lastInterventionElementRef : null}
                        >
                          <InterventionCard
                            intervention={intervention}
                            isSelected={selectedIntervention?.id === intervention.id}
                            onClick={() => setSelectedIntervention(intervention)}
                          />
                        </div>
                      );
                    })}

                    {loading && (
                      <div className="space-y-0">
                        {[...Array(3)].map((_, i) => (
                          <InterventionSkeleton key={i} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {sidebarCollapsed && (
            <div className="hidden lg:flex flex-col items-center py-6 space-y-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#007A49] to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                <Trees className="h-4 w-4 text-white" />
              </div>
              <div className="text-xs font-bold text-slate-600 transform rotate-90 whitespace-nowrap">
                {filteredInterventions.length}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Details and Map */}
        <div className="flex-1 flex flex-col overflow-y-auto" style={{ marginBottom: 20 }}>
          {selectedIntervention ? (
            loading && !selectedIntervention ? (
              <DetailsSkeleton />
            ) : (
              <InterventionDetails
                intervention={selectedIntervention}
                hoveredTree={hoveredTree}
                tooltipPosition={tooltipPosition}
                onTreeHover={handleTreeHover}
                onTreeLeave={handleTreeLeave}
              />
            )
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Eye className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">
                  Select an Intervention
                </h3>
                <p className="text-base text-slate-600 max-w-md">
                  Choose an intervention from the sidebar to view detailed information, species data, tree records, and location mapping
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TreeMapperUI;