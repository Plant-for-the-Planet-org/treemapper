import React, { useState, useMemo } from 'react';
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

// Mock data based on your schema
const mockSites = [
  { id: 1, uid: 'site_001', name: 'Northern Forest Plot', projectId: 1 },
  { id: 2, uid: 'site_002', name: 'Riverside Restoration Area', projectId: 1 },
  { id: 3, uid: 'site_003', name: 'Mountain Slope Section', projectId: 1 },
];

const mockInterventions = [
  {
    id: 1,
    uid: 'int_001',
    hid: 'FOR-2025-001',
    type: 'enrichment-planting',
    projectSiteId: 1,
    userId: 1,
    userName: 'John Doe',
    captureMode: 'on_site',
    captureStatus: 'complete',
    interventionStatus: 'active',
    registrationDate: '2025-01-15T10:30:00Z',
    interventionStartDate: '2025-01-15T08:00:00Z',
    interventionEndDate: '2025-01-15T16:00:00Z',
    treesPlanted: 150,
    sampleTreeCount: 25,
    description: 'Enrichment planting of native species in degraded forest area',
    image: '/api/placeholder/400/300',
    location: { type: 'Point', coordinates: [-74.006, 40.7128] },
    metadata: { soilType: 'clay', weather: 'sunny', temperature: '22°C' }
  },
  {
    id: 2,
    uid: 'int_002',
    hid: 'FOR-2025-002',
    type: 'direct-seeding',
    projectSiteId: 1,
    userId: 2,
    userName: 'Sarah Wilson',
    captureMode: 'on_site',
    captureStatus: 'complete',
    interventionStatus: 'completed',
    registrationDate: '2025-01-10T09:15:00Z',
    interventionStartDate: '2025-01-10T07:30:00Z',
    interventionEndDate: '2025-01-10T15:45:00Z',
    treesPlanted: 200,
    sampleTreeCount: 30,
    description: 'Direct seeding program for reforestation',
    image: '/api/placeholder/400/300',
    location: { type: 'Point', coordinates: [-74.008, 40.7148] },
    metadata: { soilType: 'sandy', weather: 'cloudy', humidity: '65%' }
  },
  {
    id: 3,
    uid: 'int_003',
    hid: 'FOR-2025-003',
    type: 'removal-invasive-species',
    projectSiteId: 2,
    userId: 1,
    userName: 'John Doe',
    captureMode: 'on_site',
    captureStatus: 'partial',
    interventionStatus: 'active',
    registrationDate: '2025-01-20T11:00:00Z',
    interventionStartDate: '2025-01-20T09:00:00Z',
    interventionEndDate: '2025-01-20T17:00:00Z',
    treesPlanted: 0,
    sampleTreeCount: 0,
    description: 'Removal of invasive plant species',
    image: '/api/placeholder/400/300',
    location: { type: 'Point', coordinates: [-74.010, 40.7168] },
    metadata: { invasiveSpecies: 'Japanese Knotweed', area: '2.5 hectares' }
  },
  {
    id: 4,
    uid: 'int_004',
    hid: 'FOR-2025-004',
    type: 'maintenance',
    projectSiteId: null,
    userId: 3,
    userName: 'Mike Johnson',
    captureMode: 'off_site',
    captureStatus: 'complete',
    interventionStatus: 'completed',
    registrationDate: '2025-01-05T14:20:00Z',
    interventionStartDate: '2025-01-05T08:00:00Z',
    interventionEndDate: '2025-01-05T12:00:00Z',
    treesPlanted: 0,
    sampleTreeCount: 0,
    description: 'General maintenance of existing plantings',
    image: '/api/placeholder/400/300',
    location: { type: 'Point', coordinates: [-74.012, 40.7188] },
    metadata: { maintenanceType: 'pruning', tools: 'manual' }
  }
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
  'other-intervention': Target
};

const InterventionView = () => {
  const [selectedSite, setSelectedSite] = useState('all');
  const [selectedIntervention, setSelectedIntervention] = useState(mockInterventions[0]);
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
    let filtered = mockInterventions;

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
  }, [selectedSite, filters]);
  const { push } = useRouter()

  const formatDate = (dateString) => {
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

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-50 to-emerald-50/30 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-6 py-3 shadow-sm mt-4">
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
                <h1
                  style={{ margin: 0 }}
                  className="text-3xl font-bold text-slate-800 tracking-tight">
                  Project Interventions
                </h1>
              </div>
            </div>

            {/* Mobile CTA Buttons */}
            <div className="flex xl:hidden items-center space-x-2">
              <button
                onClick={() => {/* Handle download */ }}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all duration-200 hover:scale-105"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  push(`/dashboard/new-intervention`)
                }}
                className="p-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-md"
                title="Add Intervention"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Site Selector */}
              <div className="relative">
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="appearance-none bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-300 transition-all hover:bg-white hover:shadow-sm min-w-[140px]"
                >
                  <option value="all">All Sites</option>
                  <option value="no-site">No Site Assigned</option>
                  {mockSites.map(site => (
                    <option key={site.id} value={site.id.toString()}>
                      {site.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Type Filter */}
              <div className="relative">
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="appearance-none bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-300 transition-all hover:bg-white hover:shadow-sm min-w-[140px]"
                >
                  <option value="all">All Types</option>
                  <option value="enrichment-planting">Enrichment Planting</option>
                  <option value="direct-seeding">Direct Seeding</option>
                  <option value="removal-invasive-species">Remove Invasive Species</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="appearance-none bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-300 transition-all hover:bg-white hover:shadow-sm min-w-[140px]"
                >
                  <option value="all">All Status</option>
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="on_hold">On Hold</option>
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
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
                onClick={() => {
                  push(`/dashboard/new-intervention`)
                }}
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
      <div className="flex-1 flex overflow-y-auto" style={{ marginBottom: '6vh' }}>
        {/* Left Panel - Intervention List */}
        <div className={`${sidebarCollapsed ? 'w-0 lg:w-16' : 'w-full md:w-96 lg:w-80 xl:w-96'} 
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
              <div className="p-6 border-b border-slate-200/60">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800">Interventions</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                      {filteredInterventions.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredInterventions.map((intervention, index) => {
                  const IconComponent = interventionTypeIcons[intervention.type] || Target;
                  const isSelected = selectedIntervention?.id === intervention.id;

                  return (
                    <div
                      key={intervention.id}
                      onClick={() => setSelectedIntervention(intervention)}
                      className={`p-5 border-b border-slate-100/80 cursor-pointer transition-all duration-200 hover:bg-white/80 hover:shadow-sm group
                        ${isSelected ? 'bg-gradient-to-r from-emerald-50/80 to-white border-l-4 border-l-emerald-500 shadow-sm' : ''}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-xl transition-all duration-200 group-hover:scale-105
                          ${isSelected ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                          <IconComponent className={`h-5 w-5 transition-colors ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-base font-semibold text-slate-800 truncate leading-tight">
                              {intervention.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </h3>
                            <span className={`text-xs px-3 py-1 rounded-full border font-medium whitespace-nowrap ml-2 ${getStatusColor(intervention.interventionStatus)}`}>
                              {intervention.interventionStatus}
                            </span>
                          </div>

                          <div className="flex items-center text-sm text-slate-600 mb-2">
                            <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                            {formatDate(intervention.registrationDate)}
                          </div>

                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                              {intervention.hid}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getCaptureStatusColor(intervention.captureStatus)}`}>
                              {intervention.captureStatus}
                            </span>
                          </div>

                          {intervention.description && (
                            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                              {intervention.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-4 mt-3 text-xs text-slate-500">
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {intervention.userName}
                            </span>
                            {intervention.treesPlanted > 0 && (
                              <span className="flex items-center">
                                <Trees className="h-3 w-3 mr-1" />
                                {intervention.treesPlanted} trees
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
        <div className="flex-1 flex flex-col" style={{ marginBottom: '6vh' }}>
          {selectedIntervention ? (
            <>
              {/* Map Area */}
              <div className="flex-1 bg-white/60 backdrop-blur-sm m-6 mb-4 rounded-2xl border border-slate-200/60 relative overflow-hidden shadow-lg">
                {/* Map Background with Subtle Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-slate-50/50">
                  <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23007A49' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '30px 30px'
                  }}></div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="mb-6 relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                        <MapPin className="h-10 w-10 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-3">
                       Map View
                    </h3>
                    <p className="text-slate-600 mb-4 max-w-md">
                      Geographic visualization and intervention plotting will be displayed here
                    </p>
                    <div className="inline-flex items-center space-x-2 text-sm text-slate-500 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedIntervention.location?.coordinates?.join(', ') || 'Coordinates pending'}</span>
                    </div>
                  </div>
                </div>

                {/* Map Controls */}
                <div className="absolute top-6 right-6 flex flex-col space-y-3">
                  <button className="p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-white/20">
                    <Layers className="h-5 w-5 text-slate-600" />
                  </button>
                  <button className="p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-white/20">
                    <Info className="h-5 w-5 text-slate-600" />
                  </button>
                </div>
              </div>

              {/* Bottom Cards */}
              <div className="h-52 px-6 pb-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-full">
                  {/* Measurements Card */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-slate-800">Measurements</h4>
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                        <Target className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Trees Planted</span>
                        <p className="text-2xl font-bold text-slate-800">{selectedIntervention.treesPlanted || 0}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sample Trees</span>
                        <p className="text-lg font-semibold text-slate-700">{selectedIntervention.sampleTreeCount || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Creator Card */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-slate-800">Created By</h4>
                      <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-800 mb-1">{selectedIntervention.userName}</p>
                      <p className="text-sm text-slate-600 mb-3">
                        {formatDate(selectedIntervention.registrationDate)}
                      </p>
                      <span className={`text-xs px-3 py-1 rounded-full border font-medium ${getStatusColor(selectedIntervention.interventionStatus)}`}>
                        {selectedIntervention.interventionStatus}
                      </span>
                    </div>
                  </div>

                  {/* Image Card */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-slate-800">Documentation</h4>
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                        <Camera className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="relative h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden group-hover:shadow-inner transition-all">
                      {selectedIntervention.image ? (
                        <img
                          src={selectedIntervention.image}
                          alt="Intervention Documentation"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Camera className="h-8 w-8 text-slate-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline Card */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-slate-800">Timeline</h4>
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl group-hover:scale-110 transition-transform">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Start Date</span>
                        <p className="text-sm font-semibold text-slate-800">
                          {formatDate(selectedIntervention.interventionStartDate)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">End Date</span>
                        <p className="text-sm font-semibold text-slate-800">
                          {formatDate(selectedIntervention.interventionEndDate)}
                        </p>
                      </div>
                      <span className={`inline-block text-xs px-3 py-1 rounded-full border font-medium ${getCaptureStatusColor(selectedIntervention.captureStatus)}`}>
                        {selectedIntervention.captureStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Eye className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">
                  Select an Intervention
                </h3>
                <p className="text-slate-600 max-w-md">
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