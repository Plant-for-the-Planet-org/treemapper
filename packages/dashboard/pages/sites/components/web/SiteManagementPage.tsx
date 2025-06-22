import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  MapPin,
  Calendar,
  User,
  FileText,
  Camera,
  AlertTriangle,
  Search,
  Filter,
  TreePine,
  AreaChart,
  Clock,
  Map
} from 'lucide-react';
import AddNewSite from './AddNewSite';
import useProjectStore from '../../../../store/useProjectStore';
import { useToken } from '../../../../context/TokenContext'
import { getUserProjectSites } from '../../../../api/api.fetch';
import { toast } from 'react-toastify'
import Spinner from '../../../../components/spinner/Spinner'
import { findAreaInHa } from '../../../../utils/geoJSON.helper';
import SiteViewer from './MapComponent';
import { useRouter } from 'solito/navigation'


const SiteManagementPage = () => {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSite, setEditedSite] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false)
  const selectedProject = useProjectStore(state => state.selectedProject)
  const { accessToken } = useToken()
  const { push } = useRouter()

  useEffect(() => {
    if (isEditing && selectedSite) {
      setEditedSite({ ...selectedSite });
    }
  }, [isEditing, selectedSite]);


  useEffect(() => {
    if (selectedProject) {
      fetchProjectSites()
    }
  }, [selectedProject]);

  const fetchProjectSites = async () => {
    setLoading(true)
    setSelectedSite(null)
    const response = await getUserProjectSites(accessToken || '', selectedProject?.uid)
    if (!response || response === null) {
      setLoading(false)
      toast.error("Error fetching project sites")
      return
    }
    const mappedResponse = transformResponseData(response.data)
    setSites(mappedResponse)
    if (mappedResponse.length > 0) {
      setSelectedSite(mappedResponse[0])
    }
    setLoading(false)
  }

  const handleCreateNewSite = () => {
    push(`/dashboard/newsite`)

  }


  function transformResponseData(responseArray) {
    return responseArray.map(item => {




      // Format dates
      const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
      };

      // Truncate description to first two sentences for cleaner display
      const truncateDescription = (desc) => {
        if (!desc) {
          return ''
        }
        const sentences = desc.split(/[.!?]+/);
        return sentences.length > 2
          ? sentences.slice(0, 2).join('. ').trim() + '.'
          : desc;
      };

      return {
        name: item.name,
        id: item.uid,
        description: truncateDescription(item.description),
        status: item.status,
        createdBy: item.createdBy?.displayName || item.createdBy?.name || null,
        createdAt: formatDate(item.createdAt),
        lastUpdate: formatDate(item.updatedAt),
        area: areaLabel(item.originalGeometry),
        treeCapacity: null,
        image: null, // Not present in source data
        geometry: item.originalGeometry || null
      };
    });
  }

  const filteredSites = sites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || site.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedSite) {
      const updatedSites = sites.map(site =>
        site.id === editedSite.id
          ? { ...editedSite, lastUpdate: new Date().toISOString().split('T')[0] }
          : site
      );
      
      setSites(updatedSites);
      setSelectedSite(editedSite);
      setIsEditing(false);
      setEditedSite(null);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedSite(null);
  };

  const handleDelete = () => {

   

    const updatedSites = sites.filter(site => site.id !== selectedSite.id);
    setSites(updatedSites);
    setSelectedSite(updatedSites[0] || null);
    setShowDeleteModal(false);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'planting':
        return {
          bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
          text: 'text-green-700',
          border: 'border-green-200',
          dot: 'bg-green-500'
        };
      case 'planning':
        return {
          bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          dot: 'bg-blue-500'
        };
      case 'completed':
        return {
          bg: 'bg-gradient-to-r from-gray-50 to-slate-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          dot: 'bg-gray-500'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-yellow-50 to-orange-50',
          text: 'text-yellow-700',
          border: 'border-yellow-200',
          dot: 'bg-yellow-500'
        };
    }
  };

  const renderMap = () => {
    if (!selectedSite?.geometry) {
      return (
        <div className="h-80 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
          <div className="text-center text-gray-500">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-medium text-gray-600">No location data available</p>
            <p className="text-sm text-gray-500 mt-1">Add coordinates to display map</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-80 bg-gradient-to-br from-green-100 via-emerald-50 to-blue-100 rounded-xl flex items-center justify-center relative overflow-hidden border border-green-200 shadow-inner">
        <div className="absolute inset-0 bg-gradient-to-br from-green-200/30 to-blue-200/30 rounded-xl"></div>
        <div className="absolute top-4 left-4 right-4">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm w-fit">
            <Map className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Interactive Map</span>
          </div>
        </div>
        <div className="text-center text-green-700 z-10">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <p className="font-semibold text-lg text-gray-800">{selectedSite.name}</p>
          {/* <p className="text-sm text-gray-600 mt-1 bg-white/80 px-3 py-1 rounded-full">
            Lat: {selectedSite.geometry.coordinates[0][0][1].toFixed(4)},
            Lng: {selectedSite.geometry.coordinates[0][0][0].toFixed(4)}
          </p> */}
        </div>
      </div>
    );
  };

  const areaLabel = (geometry) => {
    const d = findAreaInHa(geometry)
    return d ? `${d} ha` : "Not available"
  }

  return (
    <div className='w-full f-full'>
      {/* Modern Sticky Header */}
      <div className="sticky top-0 z-20 backdrop-blur-md bg-white/80 border-b border-white/20 shadow-sm ">
        <div className="w-full f-full px-4 py-3 h-full flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br mb-1 from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <TreePine className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 leading-tight" style={{ margin: 0 }}>Site Management</h1>
              </div>
            </div>
            <button
              onClick={handleCreateNewSite}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Site
            </button>
          </div>

          <div className="flex gap-3 mt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search sites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none w-full bg-white shadow-sm"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-6 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none appearance-none bg-white shadow-sm min-w-[120px]"
              >
                <option value="all">All</option>
                <option value="planning">Planning</option>
                <option value="planting">Planting</option>
                <option value="barren">Barren</option>
                <option value="reforestation">Reforestation</option>
              </select>
            </div>
          </div>
        </div>
      </div>


      <div className="w-full h-full px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Enhanced Site List - Card Style */}
          {loading ?
            <div className="xl:col-span-2 overflow-y-auto max-h-full">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <Spinner h={'1vh'} />
                </div>
              </div>
            </div>
            : <div className="xl:col-span-2 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                      Sites Overview
                    </h2>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      {filteredSites.length} sites
                    </span>
                  </div>
                </div>

                <div className="h-full overflow-y-auto">
                  <div className="p-4 space-y-3">
                    {filteredSites.map((site) => {
                      const statusConfig = getStatusConfig(site.status);
                      const isSelected = selectedSite?.id === site.id;

                      return (
                        <div
                          key={site.id}
                          onClick={() => setSelectedSite(site)}
                          className={`group relative cursor-pointer transition-all duration-200 ${isSelected
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-md'
                            : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                            } border rounded-xl p-5 hover:shadow-lg`}
                        >
                          {/* Card Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1 truncate">
                                {site.name}
                              </h3>
                              <p className="text-xs text-gray-500 font-medium">ID: {site.id}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                              <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`}></div>
                              {site.status}
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">
                            {site.description}
                          </p>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                              <div className="flex items-center gap-2 mb-1">
                                <AreaChart className="w-3 h-3 text-blue-600" />
                                <span className="text-xs font-medium text-blue-700">Area</span>
                              </div>
                              <p className="text-sm font-semibold text-blue-800">{site.area}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-3 h-3 text-green-600" />
                                <span className="text-xs font-medium text-green-700">Created By</span>
                              </div>
                              <p className="text-sm font-semibold text-green-800">{site.createdBy}</p>
                            </div>
                          </div>

                          {/* Card Footer */}
                          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{site.createdBy}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{site.createdAt}</span>
                            </div>
                          </div>

                          {/* Selection Indicator */}
                          {isSelected && (
                            <div className="absolute inset-0 border-2 border-green-400 rounded-xl pointer-events-none"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {loading && <div style={{ paddingBottom: 100 }}>
                    <Spinner /></div>}

                  {!loading && filteredSites.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="font-medium text-gray-700 mb-2">No sites found</h3>
                      <p className="text-sm">Try adjusting your search criteria</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>}

          {/* Enhanced Site Details */}
          <div className="xl:col-span-3 overflow-y-auto top-0 h-full">
            {selectedSite ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Modern Site Header */}
                <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedSite?.name || ''}
                          onChange={(e) => setEditedSite({ ...editedSite, name: e.target.value })}
                          className="text-2xl font-bold bg-transparent border-b-2 border-white/50 focus:border-white outline-none w-full text-white placeholder-white/70"
                          placeholder="Site name..."
                        />
                      ) : (
                        <h2 className="text-3xl font-bold mb-2">{selectedSite.name}</h2>
                      )}

                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                          <div className={`w-2 h-2 rounded-full ${getStatusConfig(selectedSite.status).dot}`}></div>
                          <span className="text-sm font-medium capitalize">{selectedSite.status}</span>
                        </div>
                        <span className="text-sm opacity-80">ID: {selectedSite.id}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSave}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl transition-all duration-200"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl transition-all duration-200"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleEdit}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl transition-all duration-200"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(true)}
                            className="bg-red-500/80 hover:bg-red-600 backdrop-blur-sm p-3 rounded-xl transition-all duration-200"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                </div>

                {/* Site Content */}
                <div className="p-6">
                  {/* Enhanced Map Section */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Location & Mapping</h3>
                    </div>
                    <SiteViewer geoJsonData={selectedSite.geometry} />
                  </div>

                  {/* Enhanced Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="font-semibold text-blue-900">Created By</h4>
                        </div>
                        <p className="text-blue-800 font-medium">{selectedSite.createdBy}</p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-100">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="font-semibold text-purple-900">Created Date</h4>
                        </div>
                        <p className="text-purple-800 font-medium">{selectedSite.createdAt}</p>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-5 rounded-xl border border-orange-100">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="font-semibold text-orange-900">Last Updated</h4>
                        </div>
                        <p className="text-orange-800 font-medium">{selectedSite.lastUpdate}</p>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-100">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                            <AreaChart className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="font-semibold text-green-900">Area Size</h4>
                        </div>
                        <p className="text-green-800 font-medium text-xl">{selectedSite.area}</p>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-100">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                            <TreePine className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="font-semibold text-emerald-900">Tree Capacity</h4>
                        </div>
                        <p className="text-emerald-800 font-medium text-xl">{selectedSite.treeCapacity || 'Not available'}</p>
                      </div>

                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-5 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-500 flex items-center justify-center">
                            <Camera className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="font-semibold text-gray-900">Site Image</h4>
                        </div>
                        {selectedSite.image ? (
                          <div className="relative">
                            <img src={selectedSite.image} alt="Site" className="w-full h-24 object-cover rounded-lg" />
                          </div>
                        ) : (
                          <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                            <p className="text-gray-500 text-sm">No image uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Description */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-indigo-900">Site Description</h3>
                    </div>
                    {isEditing ? (
                      <textarea
                        value={editedSite?.description || ''}
                        onChange={(e) => setEditedSite({ ...editedSite, description: e.target.value })}
                        rows={6}
                        className="w-full p-4 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                        placeholder="Enter detailed site description..."
                      />
                    ) : (
                      <div className="prose prose-indigo max-w-none">
                        <p className="text-indigo-800 leading-relaxed whitespace-pre-wrap">
                          {selectedSite.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center h-full flex items-center justify-center">
                <div className="max-w-md">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-6">
                    <MapPin className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{loading ? "Loading sites..." : "Select a Site"}</h3>
                  {loading ?
                    <p className="text-gray-600 leading-relaxed"></p>
                    : <p className="text-gray-600 leading-relaxed">Choose a site from the list to view its detailed information, location, and management options.</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{zIndex:100}}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Delete Site</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6 leading-relaxed">
                Are you sure you want to delete site <span className="font-semibold text-gray-900">"{selectedSite?.name}"</span>? This action cannot be undone and will permanently remove all associated data.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg"
                >
                  Delete Site
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteManagementPage;


