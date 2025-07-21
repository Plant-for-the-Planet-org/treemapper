'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Download,
    Plus,
    Edit2,
    Trash2,
    Leaf,
    Heart,
    Save,
    X,
    Upload,
    Hash,
    Eye,
    EyeOff,
    MapPin,
    AlertCircle,
    Loader2,
    ChevronDown,
    Filter,
    Check,
    ArrowLeft,
    Image as ImageIcon
} from 'lucide-react';
import { useToken } from '@/context/useTokenContext';
import useProjectStore from '@shared-core/store/useProjectStore';
import { createNewProjectSpecies, generatePreSignUrl, getProjectSpecies, getSciencetificSpecies, removePrjSpecies, requestNewSpecies, updateProjectSpecies } from '@shared-core/fetchApi/api.fetch';
import { toast } from 'react-toastify';

// Loading Component
const LoadingSpinner = ({ size = 'default' }) => {
  const sizes = { small: 'w-4 h-4', default: 'w-6 h-6', large: 'w-8 h-8' };
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <Loader2 className={`${sizes[size]} text-gray-400`} />
    </motion.div>
  );
};

// Header Component
const SpeciesHeader = ({ 
  speciesCount, 
  activeCount, 
  favoriteCount, 
  searchTerm, 
  setSearchTerm,
  sortBy,
  setSortBy,
  showDisabled,
  setShowDisabled,
  onAddSpecies,
  onExport 
}) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white border-b border-gray-200"
  >
    <div className="px-6 py-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900">Species Management</h1>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md">
              <Hash size={12} />
              <span className="font-medium">{speciesCount}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md">
              <Eye size={12} />
              <span className="font-medium">{activeCount}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-md">
              <Heart size={12} />
              <span className="font-medium">{favoriteCount}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddSpecies}
            className="flex items-center gap-2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={14} />
            Add Species
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onExport}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <Download size={14} />
            Export
          </motion.button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search species..."
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white"
          >
            <option value="name">Name</option>
            <option value="date">Date</option>
            <option value="favorite">Favorite</option>
          </select>

          <button
            onClick={() => setShowDisabled(!showDisabled)}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              showDisabled 
                ? 'bg-gray-200 text-gray-700' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {showDisabled ? <Eye size={14} /> : <EyeOff size={14} />}
            {showDisabled ? 'Hide' : 'Show'} Disabled
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

// Species Card Component
const SpeciesCard = ({ species, isSelected, onClick, onToggleFavorite, onToggleDisabled }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2 }}
    onClick={onClick}
    className={`cursor-pointer border rounded-lg p-3 transition-all ${
      isSelected 
        ? 'border-green-500 bg-green-50/50 shadow-sm' 
        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
    } ${species.disabled ? 'opacity-60' : ''}`}
  >
    <div className="flex items-start gap-3">
      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
        {species.image ? (
          <img src={species.image} alt={species.commonName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate italic">
              {species.scientificName}
            </h3>
            <p className="text-xs text-gray-600 truncate mt-0.5">
              {species.commonName}
            </p>
          </div>

          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(species.uid);
              }}
              className={`p-1 rounded transition-colors ${
                species.favourite 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-300 hover:text-red-400'
              }`}
            >
              <Heart size={12} fill={species.favourite ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleDisabled(species.uid);
              }}
              className={`p-1 rounded transition-colors ${
                species.disabled 
                  ? 'text-gray-400 hover:text-gray-600' 
                  : 'text-green-500 hover:text-green-600'
              }`}
            >
              {species.disabled ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>
        </div>

        {species.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {species.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>Updated {new Date(species.updatedAt).toLocaleDateString()}</span>
          {species.metadata?.habitat && (
            <span className="truncate ml-2">{species.metadata.habitat}</span>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

// Species Search Component for Add Modal
const SpeciesSearch = ({ 
  searchTerm, 
  onSearchChange, 
  searchResults, 
  isSearching, 
  onSelectSpecies, 
  onRequestNew 
}) => (
  <div className="space-y-4">
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search species database..."
        className="w-full pl-10 pr-3 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
      />
    </div>

    {isSearching && (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    )}

    {searchResults.length > 0 && (
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {searchResults.map((species) => (
          <motion.div
            key={species.id}
            whileHover={{ scale: 1.01 }}
            onClick={() => onSelectSpecies(species)}
            className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-colors"
          >
            <h4 className="text-sm font-medium text-gray-900 italic">
              {species.scientificName}
            </h4>
            <p className="text-xs text-gray-600">{species.commonName}</p>
          </motion.div>
        ))}
      </div>
    )}

    {searchTerm.length >= 3 && !isSearching && searchResults.length === 0 && (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-gray-900 mb-2">Species not found</h3>
        <p className="text-xs text-gray-600 mb-4">
          Can't find "{searchTerm}" in our database
        </p>
        <button
          onClick={onRequestNew}
          className="px-4 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          Request New Species
        </button>
      </div>
    )}

    {searchTerm.length < 3 && (
      <div className="text-center py-8 text-gray-500">
        <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm">Enter at least 3 characters to search</p>
      </div>
    )}
  </div>
);

// Species Form Component
const SpeciesForm = ({ species, editForm, setEditForm, onImageUpload }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Scientific Name
        </label>
        <input
          type="text"
          value={editForm.scientificName}
          readOnly
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 italic"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Common Name
        </label>
        <input
          type="text"
          value={editForm.commonName}
          onChange={(e) => setEditForm({ ...editForm, commonName: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
        />
      </div>
    </div>

    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Description
      </label>
      <textarea
        value={editForm.description}
        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
        rows={3}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none resize-none"
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Habitat
        </label>
        <input
          type="text"
          value={editForm.habitat}
          onChange={(e) => setEditForm({ ...editForm, habitat: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Height
        </label>
        <input
          type="text"
          value={editForm.height}
          onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Flowers/Fruits
        </label>
        <input
          type="text"
          value={editForm.hasFlowersOrFruits}
          onChange={(e) => setEditForm({ ...editForm, hasFlowersOrFruits: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Blooming Season
        </label>
        <input
          type="text"
          value={editForm.bloomingSeason}
          onChange={(e) => setEditForm({ ...editForm, bloomingSeason: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
        />
      </div>
    </div>

    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={editForm.isNativeSpecies}
          onChange={(e) => setEditForm({ ...editForm, isNativeSpecies: e.target.checked })}
          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
        />
        Native Species
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={editForm.favourite}
          onChange={(e) => setEditForm({ ...editForm, favourite: e.target.checked })}
          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
        />
        Favorite
      </label>
    </div>

    <div>
      <label className="block text-xs font-medium text-gray-700 mb-2">
        Species Image
      </label>
      <div className="flex items-center gap-4">
        {editForm.image && (
          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
            <img src={editForm.image} alt="Species" className="w-full h-full object-cover" />
          </div>
        )}
        <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors text-sm">
          <ImageIcon size={14} />
          Upload Image
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  </div>
);

// Modal Component
const Modal = ({ isOpen, onClose, title, children, size = 'default' }) => {
  const sizeClasses = {
    default: 'max-w-2xl',
    large: 'max-w-4xl',
    small: 'max-w-md'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-white rounded-xl shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden`}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Main Component
const SpeciesManagementDashboard = () => {
  // All your existing state variables...
  const [speciesList, setSpeciesList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showDisabled, setShowDisabled] = useState(true);
  const [speciesSearchTerm, setSpeciesSearchTerm] = useState('');
  const [isSearchingSpecies, setIsSearchingSpecies] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFromSearch, setSelectedFromSearch] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageDetails, setImageDetails] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    scientificName: '',
    commonName: '',
    description: '',
    requestReason: ''
  });
  const [requestLoading, setRequestLoading] = useState(false);

  const { accessToken } = useToken();
  const selectedProject = useProjectStore(state => state.selectedProject);

  // Your existing useEffect hooks and functions...
  useEffect(() => {
    if (speciesSearchTerm.length >= 3 && isAddingNew) {
      const timeoutId = setTimeout(async () => {
        const results = await searchSpeciesByName(speciesSearchTerm);
        setSearchResults(results);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [speciesSearchTerm, isAddingNew]);

  useEffect(() => {
    fetchProjectSpecies();
  }, [selectedProject]);

  const fetchProjectSpecies = async () => {
    setLoading(true);
    if (!selectedProject?.uid) return;
    const response = await getProjectSpecies(accessToken || '', selectedProject?.uid);
    setLoading(false);
    if (response.statusCode !== 200) {
      toast.error(response.message || 'An error occurred while fetching species data.');
      return;
    }
    setSpeciesList(response.data || []);
  };

  const searchSpeciesByName = async (searchTerm) => {
    setIsSearchingSpecies(true);
    const response = await getSciencetificSpecies(accessToken || '', searchTerm);
    setIsSearchingSpecies(false);
    if (response.statusCode !== 200) {
      toast.error(response.message || 'An unexpected error occurred.');
      return [];
    }
    return response.data || [];
  };

  // Filter and sort logic
  const filteredSpecies = speciesList.filter((species) => {
    const matchesSearch = species.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      species.commonName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVisibility = showDisabled || !species.disabled;
    return matchesSearch && matchesVisibility;
  });

  const sortedSpecies = [...filteredSpecies].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.scientificName.localeCompare(b.scientificName);
      case 'date':
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      case 'favorite':
        return (b.favourite ? 1 : 0) - (a.favourite ? 1 : 0);
      default:
        return 0;
    }
  });

  const favoriteCount = speciesList.filter(s => s.favourite).length;
  const activeCount = speciesList.filter(s => !s.disabled).length;

  // Event handlers
  const handleSelectSpecies = (species) => {
    setSelectedSpecies(species);
    setShowDetailModal(true);
  };

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setSpeciesSearchTerm('');
    setSearchResults([]);
    setSelectedFromSearch(false);
    setShowAddModal(true);
  };

  const handleSelectSpeciesFromSearch = (species) => {
    setEditForm({
      ...species,
      uid: species.id,
      favourite: false,
      updatedAt: new Date().toISOString(),
      isNativeSpecies: false,
      disabled: false,
      habitat: '',
      height: '',
      hasFlowersOrFruits: '',
      bloomingSeason: ''
    });
    setSelectedFromSearch(true);
    setSpeciesSearchTerm('');
    setSearchResults([]);
  };

  const handleToggleFavorite = (uid) => {
    setSpeciesList(speciesList.map(species =>
      species.uid === uid ? { ...species, favourite: !species.favourite, updatedAt: new Date().toISOString() } : species
    ));
    if (selectedSpecies?.uid === uid) {
      setSelectedSpecies({ ...selectedSpecies, favourite: !selectedSpecies.favourite });
    }
  };

  const handleToggleDisabled = (uid) => {
    setSpeciesList(speciesList.map(species =>
      species.uid === uid ? { ...species, disabled: !species.disabled, updatedAt: new Date().toISOString() } : species
    ));
    if (selectedSpecies?.uid === uid) {
      setSelectedSpecies({ ...selectedSpecies, disabled: !selectedSpecies.disabled });
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageDetails(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartEdit = () => {
    setEditForm({ ...selectedSpecies });
    setIsEditing(true);
  };

  const uploadImage = async () => {
    // Your existing upload logic...
    return { fileName: '', success: false };
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Your existing save logic...
      setIsEditing(false);
      setIsAddingNew(false);
      setShowDetailModal(false);
      setShowAddModal(false);
    } catch (error) {
      toast.error(`Error uploading data: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsAddingNew(false);
    setShowDetailModal(false);
    setShowAddModal(false);
  };

  const handleDelete = async () => {
    setIsRemoving(true);
    const updatedList = speciesList.filter(s => s.uid !== selectedSpecies.uid);
    setSpeciesList(updatedList);
    setSelectedSpecies(null);
    setShowConfirmModal(false);
    setShowDetailModal(false);
    setIsRemoving(false);
    await removePrjSpecies(accessToken || '', selectedProject?.uid, selectedSpecies.uid);
  };

  const downloadJsonAsCsv = (jsonData, filename) => {
    // Your existing export logic...
  };

  const handleRequestNew = () => {
    setRequestForm({
      scientificName: speciesSearchTerm,
      commonName: '',
      description: '',
      requestReason: ''
    });
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    // Your existing request logic...
  };

  return (
    <div className="bg-gray-50 flex flex-col h-screen w-full">
      <SpeciesHeader
        speciesCount={speciesList.length}
        activeCount={activeCount}
        favoriteCount={favoriteCount}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        showDisabled={showDisabled}
        setShowDisabled={setShowDisabled}
        onAddSpecies={handleStartAdd}
        onExport={() => downloadJsonAsCsv(speciesList, 'species-data')}
      />

      <div className="flex-1 overflow-hidden p-6">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <LoadingSpinner size="large" />
          </div>
        ) : sortedSpecies.length === 0 ? (
          <div className="text-center py-12">
            <Leaf size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">No species found</p>
            <p className="text-gray-400 text-sm">Start adding species to this project</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedSpecies.map((species) => (
              <SpeciesCard
                key={species.uid}
                species={species}
                isSelected={selectedSpecies?.uid === species.uid}
                onClick={() => handleSelectSpecies(species)}
                onToggleFavorite={handleToggleFavorite}
                onToggleDisabled={handleToggleDisabled}
              />
            ))}
          </div>
        )}
      </div>

      {/* Species Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={isEditing ? "Edit Species" : selectedSpecies?.scientificName}
        size="large"
      >
        {selectedSpecies && (
          <div className="space-y-6">
            {isEditing ? (
              <SpeciesForm
                species={selectedSpecies}
                editForm={editForm}
                setEditForm={setEditForm}
                onImageUpload={handleImageUpload}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {selectedSpecies.image ? (
                      <img src={selectedSpecies.image} alt={selectedSpecies.commonName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Leaf className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 italic mb-1">
                      {selectedSpecies.scientificName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{selectedSpecies.commonName}</p>
                    <div className="flex items-center gap-3 text-xs">
                      {selectedSpecies.favourite && (
                        <span className="flex items-center gap-1 text-red-600">
                          <Heart size={12} fill="currentColor" />
                          Favorite
                        </span>
                      )}
                      {selectedSpecies.isNativeSpecies && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          Native
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full ${
                        selectedSpecies.disabled 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {selectedSpecies.disabled ? 'Disabled' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedSpecies.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-600">{selectedSpecies.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedSpecies.metadata?.habitat && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">Habitat</h5>
                      <p className="text-gray-600">{selectedSpecies.metadata.habitat}</p>
                    </div>
                  )}
                  {selectedSpecies.metadata?.height && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">Height</h5>
                      <p className="text-gray-600">{selectedSpecies.metadata.height}</p>
                    </div>
                  )}
                  {selectedSpecies.metadata?.flowers && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">Flowers/Fruits</h5>
                      <p className="text-gray-600">{selectedSpecies.metadata.flowers}</p>
                    </div>
                  )}
                  {selectedSpecies.metadata?.bloomingSeason && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">Blooming Season</h5>
                      <p className="text-gray-600">{selectedSpecies.metadata.bloomingSeason}</p>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  Last updated: {new Date(selectedSpecies.updatedAt).toLocaleString()}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? <LoadingSpinner size="small" /> : <Save size={14} />}
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                  <button
                    onClick={handleStartEdit}
                    className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Species Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Species"
        size="large"
      >
        <div className="space-y-6">
          {!selectedFromSearch ? (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">
                Search Species Database
              </h4>
              <SpeciesSearch
                searchTerm={speciesSearchTerm}
                onSearchChange={setSpeciesSearchTerm}
                searchResults={searchResults}
                isSearching={isSearchingSpecies}
                onSelectSpecies={handleSelectSpeciesFromSearch}
                onRequestNew={handleRequestNew}
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => {
                    setSelectedFromSearch(false);
                    setEditForm({});
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <h4 className="text-sm font-medium text-gray-900">
                  Species Details
                </h4>
              </div>
              <SpeciesForm
                species={editForm}
                editForm={editForm}
                setEditForm={setEditForm}
                onImageUpload={handleImageUpload}
              />
            </div>
          )}

          {selectedFromSearch && (
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <LoadingSpinner size="small" /> : <Plus size={14} />}
                {loading ? 'Adding...' : 'Add Species'}
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Request New Species Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Request New Species"
        size="default"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Scientific Name
            </label>
            <input
              type="text"
              value={requestForm.scientificName}
              onChange={(e) => setRequestForm(prev => ({ ...prev, scientificName: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none italic"
              placeholder="e.g. Acer saccharum"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Common Name
            </label>
            <input
              type="text"
              value={requestForm.commonName}
              onChange={(e) => setRequestForm(prev => ({ ...prev, commonName: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
              placeholder="e.g. Sugar Maple"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={requestForm.description}
              onChange={(e) => setRequestForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none resize-none"
              placeholder="Brief description of the species..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Request Reason
            </label>
            <textarea
              value={requestForm.requestReason}
              onChange={(e) => setRequestForm(prev => ({ ...prev, requestReason: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none resize-none"
              placeholder="Why do you need this species in the database?"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowRequestModal(false)}
              disabled={requestLoading}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitRequest}
              disabled={requestLoading}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {requestLoading ? <LoadingSpinner size="small" /> : <Check size={14} />}
              {requestLoading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Delete Species"
        size="small"
      >
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Remove Species
            </h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <strong className="italic">{selectedSpecies?.scientificName}</strong> from this project?
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={() => setShowConfirmModal(false)}
              disabled={isRemoving}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isRemoving}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isRemoving ? <LoadingSpinner size="small" /> : <Trash2 size={14} />}
              {isRemoving ? 'Removing...' : 'Yes, Remove'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SpeciesManagementDashboard;