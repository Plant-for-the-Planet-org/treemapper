import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  TreePine
} from 'lucide-react';
import MapDisplayComponent from './ProjectSelectMap';

import { useToken } from '../../../../context/TokenContext';
import { getProjectIntervention } from '../../../../api/api.fetch';
import useProjectStore from '../../../../store/useProjectStore'
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

// Skeleton Component
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

// Tree Record Component
const TreeRecord = ({ record }) => (
  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-[#007A49] rounded-lg flex items-center justify-center">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-slate-800 capitalize">
          {record.recordType?.replace('_', ' ')}
        </span>
      </div>
      <span className="text-xs text-slate-600">
        {new Date(record.recordedAt).toLocaleDateString()}
      </span>
    </div>

    <div className="grid grid-cols-2 gap-3 mb-3">
      {record.height && (
        <div className="flex items-center space-x-2">
          <Ruler className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-700">{record.height}m height</span>
        </div>
      )}
      {record.healthScore && (
        <div className="flex items-center space-x-2">
          <Heart className="w-4 h-4 text-red-500" />
          <span className="text-sm text-slate-700">{record.healthScore}% health</span>
        </div>
      )}
      {record.vitalityScore && (
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-sm text-slate-700">{record.vitalityScore}% vitality</span>
        </div>
      )}
      {record.structuralIntegrity && (
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-slate-700 capitalize">{record.structuralIntegrity}</span>
        </div>
      )}
    </div>

    {record.findings && (
      <div className="mb-3">
        <p className="text-xs text-slate-600 bg-white rounded-lg p-2">{record.findings}</p>
      </div>
    )}

    {record.recordedBy && (
      <div className="flex items-center text-xs text-slate-500">
        <User className="w-3 h-3 mr-1" />
        Recorded by {record.recordedBy.displayName}
      </div>
    )}
  </div>
);

// Tree Component
const TreeCard = ({ tree, isExpanded, onToggle }) => (
  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-200">
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-[#007A49] rounded-lg flex items-center justify-center">
            <Trees className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800">Tree {tree.tag}</h4>
            <span className="text-xs text-slate-600">{tree.hid}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${tree.status === 'alive' ? 'bg-green-100 text-green-700' :
            tree.status === 'dead' ? 'bg-red-100 text-red-700' :
              'bg-slate-100 text-slate-700'
            }`}>
            {tree.status}
          </span>
          {tree.records?.length > 0 && (
            <button
              onClick={onToggle}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isExpanded ? <Shrink className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-slate-700">
            {tree.plantingDate ? new Date(tree.plantingDate).toLocaleDateString() : 'N/A'}
          </span>
        </div>
        {tree.lastMeasuredHeight && (
          <div className="flex items-center space-x-2">
            <Ruler className="w-4 h-4 text-slate-500" />
            <span className="text-slate-700">{tree.lastMeasuredHeight}m</span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Tag className="w-4 h-4 text-slate-500" />
          <span className="text-slate-700 capitalize">{tree.treeType}</span>
        </div>
        {tree.records?.length > 0 && (
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-slate-500" />
            <span className="text-slate-700">{tree.records.length} records</span>
          </div>
        )}
      </div>
    </div>

    {isExpanded && tree.records?.length > 0 && (
      <div className="border-t border-slate-200 p-4 bg-slate-50">
        <div className="space-y-3">
          {tree.records.map((record, index) => (
            <TreeRecord key={record.uid || index} record={record} />
          ))}
        </div>
      </div>
    )}
  </div>
);

// Species Component
const SpeciesCard = ({ species }) => (
  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-[#007A49] rounded-lg flex items-center justify-center">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-800">{species.speciesName}</h4>
          {species.scientificSpecies?.commonName && (
            <span className="text-sm text-slate-600">{species.scientificSpecies.commonName}</span>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-[#007A49]">{species.count}</div>
        <div className="text-xs text-slate-600">planted</div>
      </div>
    </div>

    {species.scientificSpecies && (
      <div className="grid grid-cols-1 gap-2 text-sm">
        {species.scientificSpecies.scientificName && (
          <div className="flex items-center space-x-2">
            <Microscope className="w-4 h-4 text-slate-500" />
            <span className="text-slate-700 italic">{species.scientificSpecies.scientificName}</span>
          </div>
        )}
        {species.scientificSpecies.family && (
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span className="text-slate-700">Family: {species.scientificSpecies.family}</span>
          </div>
        )}
      </div>
    )}
  </div>
);

// Main Component
const TreeMapperUI = (props: any) => {
  const [interventions, setInterventions] = useState([]);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedTrees, setExpandedTrees] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    captureMode: 'all',
    captureStatus: 'all'
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pagination, setPagination] = useState({
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0,
    "hasNext": true,
    "hasPrev": false
  });

  // Simulate infinite scroll
  const loadMoreInterventions = useCallback(async () => {
    if (loading || !pagination.hasNext) return;

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      // Add more mock data here
      setLoading(false);
    }, 1000);
  }, [loading, pagination.hasNext]);

  // Scroll handler for infinite scroll
  useEffect(() => {
    const handleScroll = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        loadMoreInterventions();
      }
    };

    const scrollContainer = document.getElementById('interventions-list');
    scrollContainer?.addEventListener('scroll', handleScroll);
    return () => scrollContainer?.removeEventListener('scroll', handleScroll);
  }, [loadMoreInterventions]);
  const { accessToken } = useToken();
  const selectedProject = useProjectStore(state => state.selectedProject)


  useEffect(() => {
    fetchInterventionData()
  }, [selectedProject])

  const fetchInterventionData = async () => {
    const response = await getProjectIntervention(accessToken || '', selectedProject?.uid)
    if (response && response.statusCode == 200) {
      setInterventions(response.data.data)
      setPagination(response.data.pagination)

    }
  }


  // Filter interventions
  const filteredInterventions = useMemo(() => {
    let filtered = interventions;

    if (searchTerm) {
      filtered = filtered.filter(intervention =>
        intervention.hid.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intervention.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intervention.user?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intervention.site?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

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

    return filtered.sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));
  }, [interventions, searchTerm, filters]);

  const toggleTreeExpansion = (treeId) => {
    const newExpanded = new Set(expandedTrees);
    if (newExpanded.has(treeId)) {
      newExpanded.delete(treeId);
    } else {
      newExpanded.add(treeId);
    }
    setExpandedTrees(newExpanded);
  };

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

  const availableTypes = [...new Set(interventions.map(i => i.type))];

  return (
    <div className="bg-gray-50 flex flex-col h-screen w-full">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-4 sm:px-6 py-3 shadow-sm" style={{paddingTop:'7vh'}}>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center justify-between lg:justify-start" style={{ paddingTop: 20 }}>
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

            <div className="flex lg:hidden items-center space-x-2">
              <button className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all">
                <Download className="h-4 w-4" />
              </button>
              <button className="p-2 bg-gradient-to-r from-[#007A49] to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition-all">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {/* Search */}
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search interventions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/90 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#007A49]/50 focus:border-[#007A49]/30"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="appearance-none bg-white/90 border border-slate-200 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007A49]/50"
              >
                <option value="all">All Types</option>
                {availableTypes.map(type => (
                  <option key={type} value={type}>
                    {formatInterventionType(type)}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="appearance-none bg-white/90 border border-slate-200 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007A49]/50"
              >
                <option value="all">All Status</option>
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>

            <div className="hidden lg:flex items-center space-x-3">
              <button
                onClick={props.bulkUpload}
                className="flex items-center px-4 py-2 bg-white/90 border border-slate-200 text-slate-700 rounded-xl hover:bg-white hover:shadow-md transition-all font-medium">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </button>
              <button
                onClick={props.newIntervention}
                className="flex items-center px-6 py-2 bg-gradient-to-r from-[#007A49] to-green-700 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105">
                <Plus className="h-4 w-4 mr-2" />
                New Intervention
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Intervention List */}
        <div className={`${sidebarCollapsed ? 'w-0 lg:w-16' : 'w-full md:w-96 lg:w-96'} 
          bg-white/60 backdrop-blur-sm border-r border-slate-200/60 flex flex-col transition-all duration-300 ease-in-out relative`}>

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
                  </div>
                </div>
              </div>

              <div id="interventions-list" className="flex-1 overflow-y-auto">
                {filteredInterventions.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Trees className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No Interventions Found</h3>
                    <p className="text-slate-600 text-sm">Try adjusting your search or filters.</p>
                  </div>
                ) : (
                  <>
                    {filteredInterventions.map((intervention, index) => {
                      const IconComponent = interventionTypeIcons[intervention.type] || Target;
                      const isSelected = selectedIntervention?.id === intervention.id;

                      return (
                        <div
                          key={intervention.id}
                          onClick={() => setSelectedIntervention(intervention)}
                          className={`p-5 border-b border-slate-100/80 cursor-pointer transition-all duration-200 hover:bg-white/80 hover:shadow-sm group
                            ${isSelected ? 'bg-gradient-to-r from-[#007A49]/5 to-white border-l-4 border-l-[#007A49] shadow-sm' : ''}`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-xl transition-all duration-200 group-hover:scale-105 flex-shrink-0
                              ${isSelected ? 'bg-gradient-to-br from-[#007A49] to-green-600 shadow-lg shadow-[#007A49]/20' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                              <IconComponent className={`h-5 w-5 transition-colors ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="text-base font-semibold text-slate-800 truncate leading-tight">
                                  {formatInterventionType(intervention.type)}
                                </h3>
                                <span className={`text-xs px-3 py-1 rounded-full border font-medium whitespace-nowrap ml-2 ${getStatusColor(intervention.interventionStatus)}`}>
                                  {intervention.interventionStatus}
                                </span>
                              </div>

                              <div className="flex items-center text-sm text-slate-600 mb-2">
                                <Calendar className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
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

                              <div className="flex flex-col gap-2 text-xs text-slate-500">
                                <span className="flex items-center">
                                  <User className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{intervention.user?.displayName}</span>
                                </span>

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
        <div className="flex-1 flex flex-col overflow-y-auto" style={{marginBottom:20}}>
          {selectedIntervention ? (
            <>
              <div className="flex-1 bg-white/60 backdrop-blur-sm m-6 mb-4 rounded-2xl border border-slate-200/60 relative overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-slate-50/50">
                  <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23007A49' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '30px 30px'
                  }}></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <MapDisplayComponent geoJSON={selectedIntervention.originalGeometry} />
                </div>
              </div>

              {/* Details Panel */}
              <div className="h-64 px-6 pb-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm">
                  {/* Header */}
                  <div className="p-6 border-b border-slate-200/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">
                          {formatInterventionType(selectedIntervention.type)}
                        </h2>
                        <p className="text-slate-600">ID: {selectedIntervention.hid}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full border font-medium text-sm ${getStatusColor(selectedIntervention.interventionStatus)}`}>
                          {selectedIntervention.interventionStatus}
                        </span>
                        <span className={`px-3 py-1 rounded-full border font-medium text-sm ${getCaptureStatusColor(selectedIntervention.captureStatus)}`}>
                          {selectedIntervention.captureStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content Tabs */}
                  <div className="p-6 space-y-6">
                    {/* Overview Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Trees className="w-8 h-8 text-blue-600" />
                          <span className="text-2xl font-bold text-blue-900">{selectedIntervention.treeCount}</span>
                        </div>
                        <p className="text-blue-700 font-medium">Trees</p>
                      </div>

                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Leaf className="w-8 h-8 text-green-600" />
                          <span className="text-2xl font-bold text-green-900">{selectedIntervention.species?.length || 0}</span>
                        </div>
                        <p className="text-green-700 font-medium">Species</p>
                      </div>

                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <TreePine className="w-8 h-8 text-purple-600" />
                          <span className="text-2xl font-bold text-purple-900">{selectedIntervention.trees?.length || 0}</span>
                        </div>
                        <p className="text-purple-700 font-medium">Sample Trees</p>
                      </div>

                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <CalendarIcon className="w-8 h-8 text-orange-600" />
                          <span className="text-lg font-bold text-orange-900">
                            {formatDate(selectedIntervention.updatedAt)}
                          </span>
                        </div>
                        <p className="text-orange-700 font-medium">Last Update</p>
                      </div>
                    </div>

                    {/* Species Section */}
                    {selectedIntervention.species?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                          <Leaf className="w-5 h-5 mr-2 text-[#007A49]" />
                          Species Planted
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {selectedIntervention.species.map((species, index) => (
                            <SpeciesCard key={species.uid || index} species={species} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trees Section */}
                    {selectedIntervention.trees?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                          <Trees className="w-5 h-5 mr-2 text-[#007A49]" />
                          Individual Trees ({selectedIntervention.trees.length})
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {selectedIntervention.trees.map((tree) => (
                            <TreeCard
                              key={tree.id}
                              tree={tree}
                              isExpanded={expandedTrees.has(tree.id)}
                              onToggle={() => toggleTreeExpansion(tree.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-3">Intervention Details</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Registration Date:</span>
                            <span className="font-medium">{formatDate(selectedIntervention.registrationDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Start Date:</span>
                            <span className="font-medium">{formatDate(selectedIntervention.interventionStartDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">End Date:</span>
                            <span className="font-medium">{formatDate(selectedIntervention.interventionEndDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Capture Mode:</span>
                            <span className="font-medium capitalize">{selectedIntervention.captureMode?.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-800 mb-3">Location & Site</h4>
                        <div className="space-y-3 text-sm">
                          {selectedIntervention.site && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Site:</span>
                                <span className="font-medium">{selectedIntervention.site.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Site Status:</span>
                                <span className="font-medium capitalize">{selectedIntervention.site.status}</span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-600">Created By:</span>
                            <span className="font-medium">{selectedIntervention.user?.displayName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Privacy:</span>
                            <span className="font-medium">{selectedIntervention.isPrivate ? 'Private' : 'Public'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
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