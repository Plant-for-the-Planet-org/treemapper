import React, { useState, useMemo, useEffect } from 'react';
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
  Plus
} from 'lucide-react';
import { useRouter } from 'solito/navigation'
import { useToken } from '../../../../context/TokenContext'
import useProjectStore from '../../../../store/useProjectStore'
import { getProjectIntervention } from '../../../../api/api.fetch'
import { toast } from 'react-toastify'
import MapDisplayComponent from './ProjectSelectMap';

// Mock sites data - you might want to fetch this separately
const mockSites = [
  { id: 383, uid: 'site_383', name: 'Site 383', projectId: 11 },
  // Add more sites as needed
];

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

const InterventionView = () => {

  const [apiData, setApiData] = useState([])
  const { accessToken } = useToken()
  const selectedProject = useProjectStore(state => state.selectedProject)
  useEffect(() => {
    getAllIntervnetionData()
  }, [selectedProject])

  const getAllIntervnetionData = async () => {
    const response = await getProjectIntervention(accessToken || '', selectedProject?.uid)
    if (response.statusCode === 200 || response.statusCode == 201) {
      setApiData(response.data)
    } else {
      toast.error(String(response.message) || 'Intervention not fetched')
    }
  }


  // Process API data to get unique interventions with user data
  const processedInterventions = useMemo(() => {
    const interventionMap = new Map();

    apiData.forEach(item => {
      const intervention = item.interventions;
      const user = item.users;

      if (!interventionMap.has(intervention.id)) {
        // Extract coordinates from originalGeometry
        let coordinates = null;
        if (intervention.originalGeometry?.geometry) {
          if (intervention.originalGeometry.geometry.type === 'Point') {
            coordinates = intervention.originalGeometry.geometry.coordinates;
          } else if (intervention.originalGeometry.geometry.type === 'Polygon') {
            // For polygon, use the first coordinate as representative point
            coordinates = intervention.originalGeometry.geometry.coordinates[0][0];
          }
        }

        // Process planted species
        const plantedSpecies = intervention.plantedSpecies || [];
        const hasScientificSpecies = intervention.scientificSpeciesId || plantedSpecies.some(s => s.scientificSpeciesId);
        const hasOtherSpecies = intervention.otherSpecies || plantedSpecies.some(s => !s.scientificSpeciesId);

        interventionMap.set(intervention.id, {
          id: intervention.id,
          uid: intervention.uid,
          hid: intervention.hid,
          type: intervention.type,
          projectSiteId: intervention.projectSiteId,
          userId: intervention.userId,
          userName: user.displayName,
          userEmail: user.email,
          captureMode: intervention.captureMode,
          captureStatus: intervention.captureStatus,
          interventionStatus: intervention.interventionStatus,
          registrationDate: intervention.registrationDate,
          interventionStartDate: intervention.interventionStartDate,
          interventionEndDate: intervention.interventionEndDate,
          treesPlanted: intervention.treesPlanted,
          sampleTreeCount: intervention.sampleTreeCount,
          description: intervention.description,
          image: intervention.image,
          location: coordinates ? { type: 'Point', coordinates } : null,
          metadata: intervention.metadata,
          scientificSpeciesId: intervention.scientificSpeciesId,
          otherSpecies: intervention.otherSpecies,
          plantedSpecies: plantedSpecies,
          hasSpeciesData: hasScientificSpecies || hasOtherSpecies,
          originalGeometry: intervention.originalGeometry,
          status: intervention.status,
          height: intervention.height,
          width: intervention.width,
          plantingDate: intervention.plantingDate,
          hasRecords: intervention.has_records
        });
      }
    });

    return Array.from(interventionMap.values());
  }, [apiData]);

  const [selectedSite, setSelectedSite] = useState('all');
  const [selectedIntervention, setSelectedIntervention] = useState(processedInterventions[0] || null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    captureMode: 'all',
    captureStatus: 'all',
    dateRange: 'all'
  });

  // Filter interventions based on selected site and filters
  const filteredInterventions = useMemo(() => {
    let filtered = processedInterventions;

    // Filter by site
    if (selectedSite === 'no-site') {
      filtered = filtered.filter(intervention => intervention.projectSiteId === null);
    } else if (selectedSite !== 'all') {
      filtered = filtered.filter(intervention => intervention.projectSiteId === parseInt(selectedSite));
    }

    // Apply other filters
    if (filters.type !== 'all') {
      filtered = filtered.filter(intervention => intervention.type === filters.type);
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(intervention => intervention.interventionStatus === filters.status);
    }
    if (filters.captureMode !== 'all') {
      filtered = filtered.filter(intervention => intervention.captureMode === filters.captureMode);
    }
    if (filters.captureStatus !== 'all') {
      filtered = filtered.filter(intervention => intervention.captureStatus === filters.captureStatus);
    }

    // Sort by most recent
    return filtered.sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));
  }, [processedInterventions, selectedSite, filters]);

  const { push } = useRouter()

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'planned': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'failed': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'on_hold': return 'bg-slate-50 text-slate-700 border-slate-200';
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

  const formatInterventionType = (type) => {
    return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getSpeciesInfo = (intervention) => {
    if (intervention.scientificSpeciesId && intervention.otherSpecies) {
      return `Species ID: ${intervention.scientificSpeciesId}, Other: ${intervention.otherSpecies}`;
    } else if (intervention.scientificSpeciesId) {
      return `Species ID: ${intervention.scientificSpeciesId}`;
    } else if (intervention.otherSpecies) {
      return intervention.otherSpecies;
    } else if (intervention.plantedSpecies?.length > 0) {
      const speciesCount = intervention.plantedSpecies.length;
      return `${speciesCount} species planted`;
    }
    return 'No species data';
  };

  // Get unique intervention types for filter
  const availableTypes = [...new Set(processedInterventions.map(i => i.type))];

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-50 to-emerald-50/30 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-4 sm:px-6 py-3 shadow-sm mt-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Header Section */}
          <div className="flex items-center justify-between xl:justify-start">
            <div className="flex items-center space-x-4">
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
              </div>
            </div>

            {/* Mobile CTA Buttons */}
            <div className="flex xl:hidden items-center space-x-2">
              <button
                onClick={() => {/* Handle download */ }}
                className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all duration-200 hover:scale-105"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => push(`/dashboard/new-intervention`)}
                className="p-2 sm:p-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-md"
                title="Add Intervention"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Site Selector */}
              <div className="relative">
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="appearance-none bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 pr-8 sm:pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-300 transition-all hover:bg-white hover:shadow-sm min-w-[120px] sm:min-w-[140px]"
                >
                  <option value="all">All Sites</option>
                  <option value="no-site">No Site Assigned</option>
                  {mockSites.map(site => (
                    <option key={site.id} value={site.id.toString()}>
                      {site.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 sm:right-3 top-2.5 sm:top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Type Filter */}
              <div className="relative">
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="appearance-none bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 pr-8 sm:pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-300 transition-all hover:bg-white hover:shadow-sm min-w-[120px] sm:min-w-[140px]"
                >
                  <option value="all">All Types</option>
                  {availableTypes.map(type => (
                    <option key={type} value={type}>
                      {formatInterventionType(type)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 sm:right-3 top-2.5 sm:top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="appearance-none bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 pr-8 sm:pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-300 transition-all hover:bg-white hover:shadow-sm min-w-[120px] sm:min-w-[140px]"
                >
                  <option value="all">All Status</option>
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="on_hold">On Hold</option>
                </select>
                <ChevronDown className="absolute right-2 sm:right-3 top-2.5 sm:top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Desktop CTA Buttons */}
            <div className="hidden xl:flex items-center space-x-3">
              <button
                onClick={() => {/* Handle download */ }}
                className="flex items-center px-4 py-2.5 bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-700 rounded-xl hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 font-medium group"
              >
                <Download className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Download
              </button>
              <button
                onClick={() => push(`/dashboard/new-intervention`)}
                className="flex items-center px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 group"
              >
                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                Add Intervention
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-y-auto h-full w-full">
        {/* Left Panel - Intervention List */}
        <div 
         style={{marginBottom:50}}
        className={`${sidebarCollapsed ? 'w-0 lg:w-16' : 'w-full md:w-80 lg:w-80 xl:w-96'} 
          bg-white/60 backdrop-blur-sm border-r border-slate-200/60 flex flex-col transition-all duration-300 ease-in-out relative`}>

          {/* Collapse Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`hidden lg:flex absolute -right-3 top-6 z-10 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center hover:bg-slate-50 transition-all shadow-sm ${sidebarCollapsed ? 'rotate-180' : ''}`}
          >
            <ChevronLeft className="h-3 w-3 text-slate-600" />
          </button>

          {!sidebarCollapsed && (
            <>
              <div className="p-4 sm:p-6 border-b border-slate-200/60">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800">Interventions</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                      {filteredInterventions.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredInterventions.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Trees className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No Interventions Found</h3>
                    <p className="text-slate-600 text-sm">Try adjusting your filters or add a new intervention.</p>
                  </div>
                ) : (
                  filteredInterventions.map((intervention, index) => {
                    const IconComponent = interventionTypeIcons[intervention.type] || Target;
                    const isSelected = selectedIntervention?.id === intervention.id;

                    return (
                      <div
                        key={intervention.id}
                        onClick={() => setSelectedIntervention(intervention)}
                        className={`p-4 sm:p-5 border-b border-slate-100/80 cursor-pointer transition-all duration-200 hover:bg-white/80 hover:shadow-sm group
                          ${isSelected ? 'bg-gradient-to-r from-emerald-50/80 to-white border-l-4 border-l-emerald-500 shadow-sm' : ''}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-start space-x-3 sm:space-x-4">
                          <div className={`p-2.5 sm:p-3 rounded-xl transition-all duration-200 group-hover:scale-105 flex-shrink-0
                            ${isSelected ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                            <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-sm sm:text-base font-semibold text-slate-800 truncate leading-tight">
                                {formatInterventionType(intervention.type)}
                              </h3>
                              <span className={`text-xs px-2 sm:px-3 py-1 rounded-full border font-medium whitespace-nowrap ml-2 ${getStatusColor(intervention.interventionStatus)}`}>
                                {intervention.interventionStatus}
                              </span>
                            </div>

                            <div className="flex items-center text-xs sm:text-sm text-slate-600 mb-2">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{formatDate(intervention.registrationDate)}</span>
                            </div>

                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                                {intervention.hid}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getCaptureStatusColor(intervention.captureStatus)}`}>
                                {intervention.captureStatus}
                              </span>
                            </div>

                            {intervention.description && (
                              <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed mb-2">
                                {intervention.description}
                              </p>
                            )}

                            <div className="flex flex-col gap-2 text-xs text-slate-500">
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{intervention.userName}</span>
                              </span>

                              {intervention.hasSpeciesData && (
                                <span className="flex items-center">
                                  <Leaf className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{getSpeciesInfo(intervention)}</span>
                                </span>
                              )}

                              {(intervention.treesPlanted > 0 || intervention.type.includes('tree')) && (
                                <span className="flex items-center">
                                  <Trees className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span>{intervention.treesPlanted || 'Tree data'}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {sidebarCollapsed && (
            <div className="hidden lg:flex flex-col items-center py-6 space-y-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                <Trees className="h-4 w-4 text-white" />
              </div>
              <div className="text-xs font-bold text-slate-600 writing-mode-vertical transform rotate-180">
                {filteredInterventions.length}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Details and Map */}
        <div className="flex-1 flex flex-col overflow-y-auto ">
          {selectedIntervention ? (
            <>
              {/* Map Area */}
              <div className="flex-1 bg-white/60 backdrop-blur-sm m-3 sm:m-6 mb-2 sm:mb-4 rounded-2xl border border-slate-200/60 relative overflow-hidden shadow-lg">
                {/* Map Background with Subtle Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-slate-50/50">
                  <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23007A49' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '30px 30px'
                  }}></div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center p-4">
                 <MapDisplayComponent geoJSON={selectedIntervention.originalGeometry}/>
                </div>
              </div>

              {/* Bottom Cards */}
              <div className="h-48 sm:h-52 px-3 sm:px-6 pb-3 sm:pb-6" style={{marginBottom:50}}>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 h-full">
                  {/* Data Card */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">Data</h4>
                      <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
                        <Target className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      {selectedIntervention.treesPlanted && (
                        <div>
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Trees Planted</span>
                          <p className="text-lg sm:text-2xl font-bold text-slate-800">{selectedIntervention.treesPlanted}</p>
                        </div>
                      )}
                      {selectedIntervention.hasSpeciesData && (
                        <div>
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Species</span>
                          <p className="text-xs sm:text-sm font-semibold text-slate-700 line-clamp-2">{getSpeciesInfo(selectedIntervention)}</p>
                        </div>
                      )}
                      {!selectedIntervention.treesPlanted && !selectedIntervention.hasSpeciesData && (
                        <div>
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Type</span>
                          <p className="text-sm sm:text-lg font-semibold text-slate-700">{formatInterventionType(selectedIntervention.type)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Creator Card */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">Created By</h4>
                      <div className="p-1.5 sm:p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm sm:text-lg font-bold text-slate-800 mb-1 line-clamp-1">{selectedIntervention.userName}</p>
                      <p className="text-xs sm:text-sm text-slate-600 mb-2 sm:mb-3">
                        {formatDate(selectedIntervention.registrationDate)}
                      </p>
                      <span className={`text-xs px-2 sm:px-3 py-1 rounded-full border font-medium ${getStatusColor(selectedIntervention.interventionStatus)}`}>
                        {selectedIntervention.interventionStatus}
                      </span>
                    </div>
                  </div>

                  {/* Image Card */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">Documentation</h4>
                      <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
                        <Camera className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                    </div>
                    <div className="relative h-16 sm:h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg sm:rounded-xl overflow-hidden group-hover:shadow-inner transition-all">
                      {selectedIntervention.image ? (
                        <img
                          src={selectedIntervention.image}
                          alt="Intervention Documentation"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline Card */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">Timeline</h4>
                      <div className="p-1.5 sm:p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <div>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Start Date</span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-800">
                          {formatDate(selectedIntervention.interventionStartDate)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">End Date</span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-800">
                          {formatDate(selectedIntervention.interventionEndDate)}
                        </p>
                      </div>
                      <span className={`inline-block text-xs px-2 sm:px-3 py-1 rounded-full border font-medium ${getCaptureStatusColor(selectedIntervention.captureStatus)}`}>
                        {selectedIntervention.captureStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Eye className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2 sm:mb-3">
                  Select an Intervention
                </h3>
                <p className="text-sm sm:text-base text-slate-600 max-w-md">
                  Choose an intervention from the sidebar to view detailed information, location data, and documentation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterventionView;