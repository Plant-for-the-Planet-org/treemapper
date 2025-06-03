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
  Filter
} from 'lucide-react';
import AddNewSite from './AddNewSite'; // Import your AddNewSite component

// Mock data based on your example
const mockSites = [
  {
    name: "PlanBe Forest - Las Américas 6",
    id: "site_7KD2pj7hX40Ainz",
    description: "Purchased with funds of a private endowment the area of 1,1000 square meters offers space for around 1,2 million trees. The area degraded by deforestation, which Plant-for-the-Planet has acquired for the purpose of reforestation, encloses a natural lagoon with high biodiversity.",
    status: "planting",
    createdBy: "John Doe",
    createdAt: "2024-03-15",
    lastUpdate: "2024-05-20",
    area: "1,100 sqm",
    treeCapacity: "1,200,000",
    image: null,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-90.118056, 18.79946],
        [-90.119887, 18.789936],
        [-90.108557, 18.787775],
        [-90.097295, 18.785587],
        [-90.100086, 18.771527],
        [-90.111266, 18.773497],
        [-90.113837, 18.759985],
        [-90.097743, 18.757785],
        [-90.080874, 18.759879],
        [-90.083156, 18.765539],
        [-90.078443, 18.783288],
        [-90.087653, 18.785156],
        [-90.086167, 18.792744],
        [-90.118056, 18.79946]
      ]]
    }
  },
  {
    name: "Reforestation Site Alpha",
    id: "site_ABC123",
    description: "Primary reforestation site focusing on native species restoration in degraded agricultural land.",
    status: "planning",
    createdBy: "Jane Smith",
    createdAt: "2024-04-01",
    lastUpdate: "2024-05-25",
    area: "850 sqm",
    treeCapacity: "950,000",
    image: null,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-90.120000, 18.800000],
        [-90.125000, 18.795000],
        [-90.115000, 18.790000],
        [-90.110000, 18.795000],
        [-90.120000, 18.800000]
      ]]
    }
  }
];

const SiteManagementPage = () => {
  const [sites, setSites] = useState(mockSites);
  const [selectedSite, setSelectedSite] = useState(sites[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSite, setEditedSite] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (isEditing && selectedSite) {
      setEditedSite({ ...selectedSite });
    }
  }, [isEditing, selectedSite]);

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'planting': return 'bg-green-100 text-green-800 border-green-200';
      case 'planning': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const renderMap = () => {
    if (!selectedSite?.geometry) {
      return (
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-2" />
            <p>No location data available</p>
          </div>
        </div>
      );
    }

    // Simple map placeholder - you'll replace this with actual map implementation
    return (
      <div className="h-64 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-green-200 opacity-30 rounded-lg transform rotate-12"></div>
        <div className="text-center text-green-700 z-10">
          <MapPin className="w-12 h-12 mx-auto mb-2" />
          <p className="font-medium">{selectedSite.name}</p>
          <p className="text-sm">Coordinates: {selectedSite.geometry.coordinates[0][0].join(', ')}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Site Management</h1>
              <p className="text-gray-600 mt-1">Manage planting sites for your project</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add New Site
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search sites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="planning">Planning</option>
                <option value="planting">Planting</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Site List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Sites ({filteredSites.length})
                </h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {filteredSites.map((site) => (
                  <div
                    key={site.id}
                    onClick={() => setSelectedSite(site)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedSite?.id === site.id ? 'bg-green-50 border-green-200' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 text-sm leading-tight">
                        {site.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(site.status)}`}>
                        {site.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {site.description}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 gap-4">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {site.createdBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {site.createdAt}
                      </span>
                    </div>
                  </div>
                ))}
                {filteredSites.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No sites found matching your criteria</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Site Details */}
          <div className="lg:col-span-2">
            {selectedSite ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Site Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedSite?.name || ''}
                          onChange={(e) => setEditedSite({...editedSite, name: e.target.value})}
                          className="text-2xl font-bold text-gray-900 border-b-2 border-green-500 bg-transparent focus:outline-none w-full"
                        />
                      ) : (
                        <h2 className="text-2xl font-bold text-gray-900">{selectedSite.name}</h2>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`px-3 py-1 text-sm rounded-full border ${getStatusColor(selectedSite.status)}`}>
                          {selectedSite.status}
                        </span>
                        <span className="text-sm text-gray-600">ID: {selectedSite.id}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSave}
                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleEdit}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(true)}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Site Content */}
                <div className="p-6">
                  {/* Map */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
                    {renderMap()}
                  </div>

                  {/* Site Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <User className="w-4 h-4 inline mr-1" />
                          Created By
                        </label>
                        <p className="text-gray-900">{selectedSite.createdBy}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Created Date
                        </label>
                        <p className="text-gray-900">{selectedSite.createdAt}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Last Updated
                        </label>
                        <p className="text-gray-900">{selectedSite.lastUpdate}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Area Size
                        </label>
                        <p className="text-gray-900">{selectedSite.area}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tree Capacity
                        </label>
                        <p className="text-gray-900">{selectedSite.treeCapacity}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Camera className="w-4 h-4 inline mr-1" />
                          Site Image
                        </label>
                        {selectedSite.image ? (
                          <img src={selectedSite.image} alt="Site" className="w-20 h-20 object-cover rounded" />
                        ) : (
                          <p className="text-gray-500 text-sm">No image uploaded</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="w-4 h-4 inline mr-1" />
                      Description
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editedSite?.description || ''}
                        onChange={(e) => setEditedSite({...editedSite, description: e.target.value})}
                        rows={6}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedSite.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Select a Site</h3>
                <p className="text-gray-600">Choose a site from the list to view its details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Site</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedSite?.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteManagementPage;