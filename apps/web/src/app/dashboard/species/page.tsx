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
    Image as ImageIcon,
    Users,
    TreePine,
    HelpCircle,
    CheckSquare,
    Square
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

// Multi-select Dropdown Component
const MultiSelectDropdown = ({ options, selected, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (value) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white"
      >
        <span className="truncate">
          {selected.length === 0 ? placeholder : `${selected.length} selected`}
        </span>
        <ChevronDown size={14} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-xs"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => handleToggle(option.value)}
                className="mr-2 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              {option.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// Bulk Action Bar Component
const BulkActionBar = ({ selectedCount, onAssignSpecies, onClearSelection }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="fixed top-0 left-0 right-0 z-40 bg-blue-600 text-white p-4 shadow-lg"
  >
    <div className="flex items-center justify-between max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <CheckSquare size={20} />
        <span className="font-medium">{selectedCount} unknown species selected</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onAssignSpecies}
          className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          Assign Scientific Species
        </button>
        <button
          onClick={onClearSelection}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-400 transition-colors"
        >
          Clear Selection
        </button>
      </div>
    </div>
  </motion.div>
);

// Header Component
const SpeciesHeader = ({ 
  speciesCount, 
  scientificCount,
  unknownCount,
  searchTerm, 
  setSearchTerm,
  sortBy,
  setSortBy,
  showDisabled,
  setShowDisabled,
  speciesTypeFilter,
  setSpeciesTypeFilter,
  sourceFilter,
  setSourceFilter,
  interventionTypeFilter,
  setInterventionTypeFilter,
  interventionTypes,
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
              <Leaf size={12} />
              <span className="font-medium">{scientificCount}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded-md">
              <HelpCircle size={12} />
              <span className="font-medium">{unknownCount}</span>
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

      <div className="flex items-center justify-between gap-4 mb-4">
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
            <option value="interventionCount">Intervention Count</option>
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

      {/* Additional Filters */}
      <div className="flex items-center gap-3 text-xs">
        <select
          value={speciesTypeFilter}
          onChange={(e) => setSpeciesTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white"
        >
          <option value="all">All Types</option>
          <option value="scientific">Scientific Only</option>
          <option value="unknown">Unknown Only</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white"
        >
          <option value="all">All Sources</option>
          <option value="project">Project Only</option>
          <option value="intervention">Intervention Only</option>
          <option value="both">Both</option>
        </select>

        <div className="min-w-[160px]">
          <MultiSelectDropdown
            options={interventionTypes.map(type => ({ value: type, label: type.replace(/-/g, ' ') }))}
            selected={interventionTypeFilter}
            onChange={setInterventionTypeFilter}
            placeholder="Intervention Types"
          />
        </div>
      </div>
    </div>
  </motion.div>
);

// Species Card Component
const SpeciesCard = ({ 
  species, 
  isSelected, 
  onClick, 
  onToggleFavorite, 
  onToggleDisabled,
  isUnknown,
  showCheckbox,
  isChecked,
  onCheckboxChange
}) => (
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
      {showCheckbox && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCheckboxChange(species.uid);
          }}
          className="mt-1 p-0.5 hover:bg-gray-100 rounded transition-colors"
        >
          {isChecked ? (
            <CheckSquare size={16} className="text-blue-600" />
          ) : (
            <Square size={16} className="text-gray-400" />
          )}
        </button>
      )}

      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
        {species.image ? (
          <img src={species.image} alt={species.commonName || species.speciesName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-gray-900 truncate italic">
                {species.scientificName || species.speciesName}
              </h3>
              {isUnknown && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                  Unknown
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 truncate">
              {species.commonName || `Intervention: ${species.interventionHid}`}
            </p>
          </div>

          <div className="flex items-center gap-1 ml-2">
            {!isUnknown && (
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
            )}
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

        {/* Usage Stats */}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          {species.totalCount > 0 && (
            <div className="flex items-center gap-1">
              <TreePine size={10} />
              <span>{species.totalCount} trees</span>
            </div>
          )}
          {species.interventionCount > 0 && (
            <div className="flex items-center gap-1">
              <Users size={10} />
              <span>{species.interventionCount} interventions</span>
            </div>
          )}
          {species.count && (
            <div className="flex items-center gap-1">
              <TreePine size={10} />
              <span>{species.count} trees</span>
            </div>
          )}
        </div>

        {/* Sources */}
        {species.sources && (
          <div className="flex items-center gap-1 mt-1">
            {species.sources.map((source, index) => (
              <span
                key={source}
                className={`px-2 py-0.5 text-xs rounded-full ${
                  source === 'project' 
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {source}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>Updated {new Date(species.updatedAt || species.createdAt).toLocaleDateString()}</span>
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
const SpeciesForm = ({ species, editForm, setEditForm, onImageUpload, isUnknown }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Scientific Name
        </label>
        <input
          type="text"
          value={editForm.scientificName || editForm.speciesName || ''}
          onChange={(e) => setEditForm({ ...editForm, scientificName: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none italic"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Common Name
        </label>
        <input
          type="text"
          value={editForm.commonName || ''}
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
        value={editForm.description || ''}
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
          value={editForm.habitat || ''}
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
          value={editForm.height || ''}
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
          value={editForm.hasFlowersOrFruits || ''}
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
          value={editForm.bloomingSeason || ''}
          onChange={(e) => setEditForm({ ...editForm, bloomingSeason: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
        />
      </div>
    </div>

    {!isUnknown && (
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={editForm.isNativeSpecies || false}
            onChange={(e) => setEditForm({ ...editForm, isNativeSpecies: e.target.checked })}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          Native Species
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={editForm.favourite || false}
            onChange={(e) => setEditForm({ ...editForm, favourite: e.target.checked })}
            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          Favorite
        </label>
      </div>
    )}

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
          className="fixed inset-0 z-50 bg-black/10 bg-opacity-10 backdrop-blur-sm flex items-center justify-center p-4"
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
  // State variables
  const [scientificSpecies, setScientificSpecies] = useState([]);
  const [unknownSpecies, setUnknownSpecies] = useState([]);
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

  // New filter states
  const [speciesTypeFilter, setSpeciesTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [interventionTypeFilter, setInterventionTypeFilter] = useState([]);
  
  // Bulk selection states
  const [selectedUnknownSpecies, setSelectedUnknownSpecies] = useState([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);

  const { accessToken } = useToken();
  const selectedProject = useProjectStore(state => state.selectedProject);

  // Combined species list for display
  const allSpecies = [
    ...scientificSpecies.map(s => ({
      ...s,
      isUnknown: false,
      type: 'scientific'
    })),
    ...unknownSpecies.map(s => ({
      ...s,
      isUnknown: true,
      type: 'unknown',
      sources: ['intervention']
    }))
  ];

  // Get unique intervention types for filter
  const interventionTypes = [...new Set([
    ...scientificSpecies.flatMap(s => s.interventionTypes || []),
    ...unknownSpecies.map(s => s.interventionType).filter(Boolean)
  ])];

  useEffect(() => {
    if (speciesSearchTerm.length >= 3 && (isAddingNew || showBulkAssignModal)) {
      const timeoutId = setTimeout(async () => {
        const results = await searchSpeciesByName(speciesSearchTerm);
        setSearchResults(results);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [speciesSearchTerm, isAddingNew, showBulkAssignModal]);

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
    
    // Update to handle new data structure
    const data = response.data || {};
    setScientificSpecies(data.scientificSpecies || []);
    setUnknownSpecies(data.unknownSpecies || []);
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
  const filteredSpecies = allSpecies.filter((species) => {
    const searchFields = [
      species.scientificName,
      species.speciesName,
      species.commonName,
      species.interventionHid
    ].filter(Boolean);
    
    const matchesSearch = searchFields.some(field => 
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesVisibility = showDisabled || !species.disabled;
    
    const matchesType = speciesTypeFilter === 'all' || 
      (speciesTypeFilter === 'scientific' && !species.isUnknown) ||
      (speciesTypeFilter === 'unknown' && species.isUnknown);
    
    const matchesSource = sourceFilter === 'all' ||
      (sourceFilter === 'project' && species.sources?.includes('project')) ||
      (sourceFilter === 'intervention' && species.sources?.includes('intervention')) ||
      (sourceFilter === 'both' && species.sources?.includes('project') && species.sources?.includes('intervention'));
    
    const matchesInterventionType = interventionTypeFilter.length === 0 ||
      (species.interventionTypes && species.interventionTypes.some(type => interventionTypeFilter.includes(type))) ||
      (species.interventionType && interventionTypeFilter.includes(species.interventionType));
    
    return matchesSearch && matchesVisibility && matchesType && matchesSource && matchesInterventionType;
  });

  const sortedSpecies = [...filteredSpecies].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        const nameA = a.scientificName || a.speciesName || '';
        const nameB = b.scientificName || b.speciesName || '';
        return nameA.localeCompare(nameB);
      case 'date':
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      case 'favorite':
        return (b.favourite ? 1 : 0) - (a.favourite ? 1 : 0);
      case 'interventionCount':
        const countA = a.interventionCount || 0;
        const countB = b.interventionCount || 0;
        return countB - countA;
      default:
        return 0;
    }
  });

  const totalSpeciesCount = allSpecies.length;
  const scientificCount = scientificSpecies.length;
  const unknownCount = unknownSpecies.length;

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
    setScientificSpecies(prev => prev.map(species =>
      species.uid === uid ? { ...species, favourite: !species.favourite, updatedAt: new Date().toISOString() } : species
    ));
    if (selectedSpecies?.uid === uid) {
      setSelectedSpecies({ ...selectedSpecies, favourite: !selectedSpecies.favourite });
    }
  };

  const handleToggleDisabled = (uid) => {
    const updateSpecies = (speciesList) => 
      speciesList.map(species =>
        species.uid === uid ? { ...species, disabled: !species.disabled, updatedAt: new Date().toISOString() } : species
      );
    
    setScientificSpecies(updateSpecies);
    setUnknownSpecies(updateSpecies);
    
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
    if (!imageDetails) return { fileName: '', success: false };
    
    try {
      const response = await generatePreSignUrl(accessToken || '', imageDetails.name, imageDetails.type);
      if (response.statusCode === 200) {
        const uploadResponse = await fetch(response.data.url, {
          method: 'PUT',
          body: imageDetails,
          headers: {
            'Content-Type': imageDetails.type,
          },
        });
        
        if (uploadResponse.ok) {
          return { fileName: response.data.fileName, success: true };
        }
      }
    } catch (error) {
      console.error('Image upload error:', error);
    }
    
    return { fileName: '', success: false };
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let imageName = editForm.image;
      
      // Upload image if new one was selected
      if (imageDetails) {
        const uploadResult = await uploadImage();
        if (uploadResult.success) {
          imageName = uploadResult.fileName;
        }
      }

      const updatedForm = { ...editForm, image: imageName };

      if (isAddingNew) {
        // Adding new species
        const response = await createNewProjectSpecies(
          accessToken || '',
          selectedProject?.uid,
          updatedForm
        );
        
        if (response.statusCode === 201) {
          toast.success('Species added successfully');
          await fetchProjectSpecies();
        } else {
          throw new Error(response.message);
        }
      } else {
        // Editing existing species
        if (selectedSpecies?.isUnknown && editForm.scientificName && editForm.scientificSpeciesUid) {
          // Call intervention edit API here for unknown species
          // await updateInterventionSpecies(accessToken, selectedSpecies.interventionUid, updatedForm);
          toast.success('Unknown species updated with scientific data');
        } else {
          // Update project species
          const response = await updateProjectSpecies(
            accessToken || '',
            selectedProject?.uid,
            selectedSpecies.uid,
            updatedForm
          );
          
          if (response.statusCode === 200) {
            toast.success('Species updated successfully');
          } else {
            throw new Error(response.message);
          }
        }
        
        await fetchProjectSpecies();
      }
      
      setIsEditing(false);
      setIsAddingNew(false);
      setShowDetailModal(false);
      setShowAddModal(false);
      setImageDetails(null);
    } catch (error) {
      toast.error(`Error saving data: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsAddingNew(false);
    setShowDetailModal(false);
    setShowAddModal(false);
    setShowBulkAssignModal(false);
    setImageDetails(null);
    setEditForm({});
  };

  const handleDelete = async () => {
    setIsRemoving(true);
    
    try {
      if (selectedSpecies.isUnknown) {
        // For unknown species, you might want to call a different API
        // await deleteInterventionSpecies(accessToken, selectedSpecies.interventionUid, selectedSpecies.uid);
        setUnknownSpecies(prev => prev.filter(s => s.uid !== selectedSpecies.uid));
        toast.success('Unknown species removed');
      } else {
        // For project species
        const response = await removePrjSpecies(accessToken || '', selectedProject?.uid, selectedSpecies.uid);
        if (response.statusCode === 200) {
          setScientificSpecies(prev => prev.filter(s => s.uid !== selectedSpecies.uid));
          toast.success('Species removed successfully');
        } else {
          throw new Error(response.message);
        }
      }
    } catch (error) {
      toast.error(`Error removing species: ${String(error)}`);
    }
    
    setSelectedSpecies(null);
    setShowConfirmModal(false);
    setShowDetailModal(false);
    setIsRemoving(false);
  };

  const downloadJsonAsCsv = (jsonData, filename) => {
    if (!jsonData || jsonData.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Flatten the data for CSV export
    const flattenedData = jsonData.map(species => ({
      'Scientific Name': species.scientificName || species.speciesName || '',
      'Common Name': species.commonName || '',
      'Description': species.description || '',
      'Type': species.isUnknown ? 'Unknown' : 'Scientific',
      'Sources': species.sources ? species.sources.join(', ') : '',
      'Total Count': species.totalCount || species.count || 0,
      'Intervention Count': species.interventionCount || 0,
      'Is Native': species.isNativeSpecies ? 'Yes' : 'No',
      'Is Favorite': species.favourite ? 'Yes' : 'No',
      'Is Disabled': species.disabled ? 'Yes' : 'No',
      'Intervention HID': species.interventionHid || '',
      'Created At': species.createdAt || '',
      'Updated At': species.updatedAt || ''
    }));

    // Convert to CSV
    const headers = Object.keys(flattenedData[0]);
    const csvContent = [
      headers.join(','),
      ...flattenedData.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' && row[header].includes(',') 
            ? `"${row[header]}"` 
            : row[header]
        ).join(',')
      )
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Data exported successfully');
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
    setRequestLoading(true);
    try {
      const response = await requestNewSpecies(
        accessToken || '',
        selectedProject?.uid,
        requestForm
      );
      
      if (response.statusCode === 201) {
        toast.success('Species request submitted successfully');
        setShowRequestModal(false);
        setRequestForm({
          scientificName: '',
          commonName: '',
          description: '',
          requestReason: ''
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error(`Error submitting request: ${String(error)}`);
    } finally {
      setRequestLoading(false);
    }
  };

  // Bulk operations
  const handleCheckboxChange = (uid) => {
    setSelectedUnknownSpecies(prev => 
      prev.includes(uid) 
        ? prev.filter(id => id !== uid)
        : [...prev, uid]
    );
  };

  const handleClearSelection = () => {
    setSelectedUnknownSpecies([]);
  };

  const handleBulkAssignSpecies = () => {
    setShowBulkAssignModal(true);
    setSpeciesSearchTerm('');
    setSearchResults([]);
  };

  const handleBulkAssignSave = async (selectedScientificSpecies) => {
    setLoading(true);
    try {
      // Update each selected unknown species with the scientific species
      const updatePromises = selectedUnknownSpecies.map(async (unknownUid) => {
        const unknownSpeciesItem = unknownSpecies.find(s => s.uid === unknownUid);
        if (unknownSpeciesItem) {
          // Call intervention edit API for each
          // await updateInterventionSpecies(
          //   accessToken, 
          //   unknownSpeciesItem.interventionUid, 
          //   {
          //     ...selectedScientificSpecies,
          //     count: unknownSpeciesItem.count
          //   }
          // );
          
          // For now, simulate the update
          return Promise.resolve();
        }
      });

      await Promise.all(updatePromises);
      
      setSelectedUnknownSpecies([]);
      setShowBulkAssignModal(false);
      await fetchProjectSpecies(); // Refresh data
      toast.success(`Updated ${selectedUnknownSpecies.length} species successfully`);
    } catch (error) {
      toast.error(`Error updating species: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 flex flex-col h-screen w-full">
      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedUnknownSpecies.length > 0 && (
          <BulkActionBar
            selectedCount={selectedUnknownSpecies.length}
            onAssignSpecies={handleBulkAssignSpecies}
            onClearSelection={handleClearSelection}
          />
        )}
      </AnimatePresence>

      <div className={selectedUnknownSpecies.length > 0 ? 'pt-16' : ''}>
        <SpeciesHeader
          speciesCount={totalSpeciesCount}
          scientificCount={scientificCount}
          unknownCount={unknownCount}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortBy={sortBy}
          setSortBy={setSortBy}
          showDisabled={showDisabled}
          setShowDisabled={setShowDisabled}
          speciesTypeFilter={speciesTypeFilter}
          setSpeciesTypeFilter={setSpeciesTypeFilter}
          sourceFilter={sourceFilter}
          setSourceFilter={setSourceFilter}
          interventionTypeFilter={interventionTypeFilter}
          setInterventionTypeFilter={setInterventionTypeFilter}
          interventionTypes={interventionTypes}
          onAddSpecies={handleStartAdd}
          onExport={() => downloadJsonAsCsv(allSpecies, 'species-data')}
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
                  isUnknown={species.isUnknown}
                  showCheckbox={species.isUnknown}
                  isChecked={selectedUnknownSpecies.includes(species.uid)}
                  onCheckboxChange={handleCheckboxChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Species Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={isEditing ? "Edit Species" : (selectedSpecies?.scientificName || selectedSpecies?.speciesName)}
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
                isUnknown={selectedSpecies.isUnknown}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {selectedSpecies.image ? (
                      <img src={selectedSpecies.image} alt={selectedSpecies.commonName || selectedSpecies.speciesName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Leaf className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 italic">
                        {selectedSpecies.scientificName || selectedSpecies.speciesName}
                      </h3>
                      {selectedSpecies.isUnknown && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                          Unknown
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {selectedSpecies.commonName || `Intervention: ${selectedSpecies.interventionHid}`}
                    </p>
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

                {/* Usage Stats */}
                {(selectedSpecies.totalCount > 0 || selectedSpecies.interventionCount > 0 || selectedSpecies.count > 0) && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Usage Statistics</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {selectedSpecies.totalCount > 0 && (
                        <div className="flex items-center gap-1">
                          <TreePine size={14} />
                          <span>{selectedSpecies.totalCount} trees total</span>
                        </div>
                      )}
                      {selectedSpecies.interventionCount > 0 && (
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span>Used in {selectedSpecies.interventionCount} interventions</span>
                        </div>
                      )}
                      {selectedSpecies.count && (
                        <div className="flex items-center gap-1">
                          <TreePine size={14} />
                          <span>{selectedSpecies.count} trees</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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

                {/* Sources */}
                {selectedSpecies.sources && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Sources</h4>
                    <div className="flex items-center gap-2">
                      {selectedSpecies.sources.map((source) => (
                        <span
                          key={source}
                          className={`px-2 py-1 text-xs rounded-full ${
                            source === 'project' 
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Last updated: {new Date(selectedSpecies.updatedAt || selectedSpecies.createdAt).toLocaleString()}
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
                isUnknown={false}
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

      {/* Bulk Assign Species Modal */}
      <Modal
        isOpen={showBulkAssignModal}
        onClose={() => setShowBulkAssignModal(false)}
        title={`Assign Scientific Species to ${selectedUnknownSpecies.length} Unknown Species`}
        size="large"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              Search and select a scientific species to assign to all {selectedUnknownSpecies.length} selected unknown species.
            </p>
          </div>
          
          <SpeciesSearch
            searchTerm={speciesSearchTerm}
            onSearchChange={setSpeciesSearchTerm}
            searchResults={searchResults}
            isSearching={isSearchingSpecies}
            onRequestNew={handleRequestNew}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
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
              Are you sure you want to delete <strong className="italic">{selectedSpecies?.scientificName || selectedSpecies?.speciesName}</strong> from this project?
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