import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  X,
  Upload,
  MapPin,
  Leaf,
  TreePine,
  AlertTriangle,
  Info,
  FileText,
  Camera,
  Check,
  AlertCircle
} from 'lucide-react';

// Mock data and API functions
const mockProjects = [
  { id: 1, name: "Amazon Reforestation Project" },
  { id: 2, name: "Congo Basin Conservation" },
  { id: 3, name: "Pacific Northwest Recovery" }
];

const mockSites = [
  { id: 1, name: "Site Alpha", projectId: 1 },
  { id: 2, name: "Site Beta", projectId: 1 },
  { id: 3, name: "Site Gamma", projectId: 2 },
  { id: 4, name: "Site Delta", projectId: 3 }
];

const mockSpecies = [
  { uid: "sp1", name: "Quercus alba (White Oak)" },
  { uid: "sp2", name: "Pinus strobus (Eastern White Pine)" },
  { uid: "sp3", name: "Acer saccharum (Sugar Maple)" },
  { uid: "sp4", name: "Fagus grandifolia (American Beech)" },
  { uid: "sp5", name: "Tsuga canadensis (Eastern Hemlock)" }
];

// Validation configuration - centralized for easy modification
const VALIDATION_CONFIG = {
  description: { maxLength: 2048 },
  treeTag: { maxLength: 100 },
  customSpeciesName: { maxLength: 255 },
  fileSize: { maxMB: 10 },
  coordinates: {
    latRange: [-90, 90],
    lngRange: [-180, 180],
    precision: 6
  }
};

// Intervention configurations
const interventionConfigurations = {
  'direct-seeding': {
    allowsSpecies: true,
    allowsMultipleSpecies: true,
    requiresSpecies: true,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    description: 'Direct seeding intervention allows multiple species but no tree registration'
  },
  'enrichment-planting': {
    allowsSpecies: true,
    allowsMultipleSpecies: true,
    requiresSpecies: true,
    allowsTreeRegistration: true,
    requiresTreeRegistration: true,
    description: 'Enrichment planting allows multiple species and requires tree registration'
  },
  'single-tree-registration': {
    allowsSpecies: true,
    allowsMultipleSpecies: false,
    requiresSpecies: true,
    allowsTreeRegistration: true,
    requiresTreeRegistration: true,
    geoJSONType: 'Point',
    description: 'Single tree registration allows single species and requires tree registration'
  },
  'multi-tree-registration': {
    allowsSpecies: true,
    allowsMultipleSpecies: true,
    requiresSpecies: true,
    allowsTreeRegistration: true,
    requiresTreeRegistration: true,
    geoJSONType: 'Polygon',
    description: 'Multi-tree registration allows multiple species and requires tree registration'
  },
  'fencing': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    description: 'Fencing intervention for site protection'
  },
  'maintenance': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    description: 'General maintenance activities'
  }
};

// Mock API functions
const searchSpecies = async (query) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = mockSpecies.filter(species =>
        species.name.toLowerCase().includes(query.toLowerCase())
      );
      resolve(filtered);
    }, 300);
  });
};

const InterventionCreator = () => {
  // Form state
  const [formData, setFormData] = useState({
    projectId: null,
    siteId: null,
    interventionType: 'single-tree-registration',
    species: [],
    unknownSpecies: [],
    description: '',
    geoJSON: null,
    geoJSONFile: null,
    applyToEntireSite: false,
    treeDetails: {
      count: 1,
      tag: '',
      height: '',
      width: '',
      plantingDate: new Date().toISOString().split('T')[0]
    },
    image: null
  });

  // UI state
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [speciesResults, setSpeciesResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showUnknownSpecies, setShowUnknownSpecies] = useState(false);
  const [unknownSpeciesName, setUnknownSpeciesName] = useState('');
  const [errors, setErrors] = useState({});
  const [isDragOver, setIsDragOver] = useState(false);

  // Get current intervention config
  const currentConfig = interventionConfigurations[formData.interventionType];

  // Get available sites for selected project
  const availableSites = mockSites.filter(site => site.projectId === formData.projectId);

  // Debounced species search
  const debounceSearch = useCallback(
    debounce(async (query) => {
      if (query.length > 0) {
        setIsSearching(true);
        try {
          const results = await searchSpecies(query);
          setSpeciesResults(results);
        } catch (error) {
          console.error('Species search error:', error);
          setSpeciesResults([]);
        }
        setIsSearching(false);
      } else {
        setSpeciesResults([]);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debounceSearch(speciesSearch);
  }, [speciesSearch, debounceSearch]);

  // Validation functions
  const validateForm = () => {
    const newErrors = {};

    // Project validation
    if (!formData.projectId) {
      newErrors.projectId = 'Project is required';
    }

    // Species validation
    if (currentConfig.requiresSpecies && formData.species.length === 0 && formData.unknownSpecies.length === 0) {
      newErrors.species = 'At least one species is required';
    }

    // GeoJSON validation
    if (!formData.applyToEntireSite && !formData.geoJSON && !formData.geoJSONFile) {
      newErrors.location = 'Location must be defined (map selection or file upload)';
    }

    // Site selection validation
    if (formData.applyToEntireSite && !formData.siteId) {
      newErrors.siteId = 'Site must be selected when applying to entire site';
    }

    // Tree registration validation
    if (currentConfig.allowsTreeRegistration && formData.interventionType === 'single-tree-registration') {
      if (!formData.treeDetails.tag.trim()) {
        newErrors.treeTag = 'Tree tag is required for single tree registration';
      }
      if (formData.treeDetails.tag.length > VALIDATION_CONFIG.treeTag.maxLength) {
        newErrors.treeTag = `Tree tag must not exceed ${VALIDATION_CONFIG.treeTag.maxLength} characters`;
      }
    }

    // Description validation
    if (formData.description.length > VALIDATION_CONFIG.description.maxLength) {
      newErrors.description = `Description must not exceed ${VALIDATION_CONFIG.description.maxLength} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Event handlers
  const handleSpeciesSelect = (species) => {
    if (!currentConfig.allowsMultipleSpecies && formData.species.length > 0) {
      setFormData(prev => ({ ...prev, species: [species] }));
    } else {
      const exists = formData.species.find(s => s.uid === species.uid);
      if (!exists) {
        setFormData(prev => ({
          ...prev,
          species: [...prev.species, species]
        }));
      }
    }
    setSpeciesSearch('');
    setSpeciesResults([]);
  };

  const handleRemoveSpecies = (speciesUid) => {
    setFormData(prev => ({
      ...prev,
      species: prev.species.filter(s => s.uid !== speciesUid)
    }));
  };

  const handleAddUnknownSpecies = () => {
    if (unknownSpeciesName.trim()) {
      const unknownSpecies = {
        uid: `unknown-${Date.now()}`,
        name: unknownSpeciesName.trim()
      };

      if (!currentConfig.allowsMultipleSpecies) {
        setFormData(prev => ({
          ...prev,
          unknownSpecies: [unknownSpecies],
          species: [] // Clear known species for single species interventions
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          unknownSpecies: [...prev.unknownSpecies, unknownSpecies]
        }));
      }

      setUnknownSpeciesName('');
      setShowUnknownSpecies(false);
    }
  };

  const handleRemoveUnknownSpecies = (speciesUid) => {
    setFormData(prev => ({
      ...prev,
      unknownSpecies: prev.unknownSpecies.filter(s => s.uid !== speciesUid)
    }));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const validateAndProcessFile = (file) => {
    const newErrors = { ...errors };
    delete newErrors.geoJSONFile;

    // File type validation
    if (file.type !== 'application/json' && !file.name.endsWith('.geojson')) {
      newErrors.geoJSONFile = 'Please upload a valid GeoJSON file';
      setErrors(newErrors);
      return;
    }

    // File size validation
    const maxSize = VALIDATION_CONFIG.fileSize.maxMB * 1024 * 1024;
    if (file.size > maxSize) {
      newErrors.geoJSONFile = `File size must not exceed ${VALIDATION_CONFIG.fileSize.maxMB}MB`;
      setErrors(newErrors);
      return;
    }

    setFormData(prev => ({ ...prev, geoJSONFile: file }));
    setErrors(newErrors);
  };

  // Mock function to simulate map component data
  const updateGeoJSON = (geoJSONData) => {
    setFormData(prev => ({ ...prev, geoJSON: geoJSONData }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare submission data
    const submissionData = {
      projectId: formData.projectId,
      siteId: formData.siteId,
      interventionType: formData.interventionType,
      species: [...formData.species, ...formData.unknownSpecies],
      description: formData.description,
      geoJSON: formData.applyToEntireSite ? null : (formData.geoJSON || formData.geoJSONFile),
      applyToEntireSite: formData.applyToEntireSite,
      treeDetails: currentConfig.allowsTreeRegistration ? formData.treeDetails : null,
      image: formData.image,
      registrationDate: new Date().toISOString(),
      captureMode: 'off_site',
      captureStatus: 'complete'
    };

    console.log('Intervention submission data:', submissionData);
    // Here you would make the API call to create the intervention
  };

  return (
    <div className="w-full h-full p-6 bg-white" style={{marginBottom:100}}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <TreePine className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Intervention</h1>
            <p className="text-gray-600">Add a new forest management intervention to your project</p>
          </div>
        </div>

        {formData.projectId && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
            <Info className="w-4 h-4" />
            <span>
              Adding intervention to: <strong>{mockProjects.find(p => p.id === formData.projectId)?.name}</strong>
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Project and Site Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.projectId || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                projectId: parseInt(e.target.value) || null,
                siteId: null
              }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.projectId ? 'border-red-300' : 'border-gray-300'
                }`}
            >
              <option value="">Select a project</option>
              {mockProjects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            {errors.projectId && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.projectId}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site (Optional)
            </label>
            <select
              value={formData.siteId || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                siteId: parseInt(e.target.value) || null
              }))}
              disabled={!formData.projectId}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${!formData.projectId ? 'bg-gray-100' : 'border-gray-300'
                } ${errors.siteId ? 'border-red-300' : ''}`}
            >
              <option value="">Select a site</option>
              {availableSites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
            {errors.siteId && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.siteId}
              </p>
            )}
          </div>
        </div>

        {/* Apply to Entire Site Option */}
        {formData.siteId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.applyToEntireSite}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  applyToEntireSite: e.target.checked,
                  geoJSON: null,
                  geoJSONFile: null
                }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-blue-900">Apply to entire site</span>
                <p className="text-sm text-blue-700">Use the complete site boundary for this intervention</p>
              </div>
            </label>
          </div>
        )}

        {/* Intervention Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Intervention Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.interventionType}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              interventionType: e.target.value,
              species: [],
              unknownSpecies: [],
              geoJSON: null,
              geoJSONFile: null
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            {Object.entries(interventionConfigurations).map(([key, config]) => (
              <option key={key} value={key}>
                {key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </option>
            ))}
          </select>

          {currentConfig && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">{currentConfig.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {currentConfig.allowsSpecies && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Species Tracking
                  </span>
                )}
                {currentConfig.allowsTreeRegistration && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Tree Registration
                  </span>
                )}
                {currentConfig.geoJSONType && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    {currentConfig.geoJSONType} Required
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Species Selection */}
        {currentConfig.allowsSpecies && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Species {currentConfig.requiresSpecies && <span className="text-red-500">*</span>}
            </label>

            {/* Species Search */}
            <div className="relative">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={speciesSearch}
                    onChange={(e) => setSpeciesSearch(e.target.value)}
                    placeholder="Search for species..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowUnknownSpecies(true)}
                  className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                >
                  Unknown Species
                </button>
              </div>

              {/* Search Results */}
              {speciesResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {speciesResults.map(species => (
                    <button
                      key={species.uid}
                      type="button"
                      onClick={() => handleSpeciesSelect(species)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Leaf className="w-4 h-4 text-green-500" />
                      {species.name}
                    </button>
                  ))}
                </div>
              )}

              {speciesSearch.length > 0 && speciesResults.length === 0 && !isSearching && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                  <p className="text-gray-500 text-sm">No species found. Try using the "Unknown Species" option.</p>
                </div>
              )}
            </div>

            {/* Unknown Species Modal */}
            {showUnknownSpecies && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-96">
                  <h3 className="text-lg font-medium mb-4">Add Unknown Species</h3>
                  <input
                    type="text"
                    value={unknownSpeciesName}
                    onChange={(e) => setUnknownSpeciesName(e.target.value)}
                    placeholder="Enter species name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
                    maxLength={VALIDATION_CONFIG.customSpeciesName.maxLength}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddUnknownSpecies}
                      disabled={!unknownSpeciesName.trim()}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                    >
                      Add Species
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUnknownSpecies(false);
                        setUnknownSpeciesName('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Species */}
            {(formData.species.length > 0 || formData.unknownSpecies.length > 0) && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">Selected Species:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.species.map(species => (
                    <div key={species.uid} className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      <Leaf className="w-3 h-3" />
                      <span className="text-sm">{species.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecies(species.uid)}
                        className="hover:text-green-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {formData.unknownSpecies.map(species => (
                    <div key={species.uid} className="flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="text-sm">{species.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveUnknownSpecies(species.uid)}
                        className="hover:text-orange-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errors.species && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.species}
              </p>
            )}
          </div>
        )}

        {/* Location Selection */}
        {!formData.applyToEntireSite && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location <span className="text-red-500">*</span>
            </label>

            <div className="space-y-4">
              {/* Map Component Placeholder */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Map</h3>
                <p className="text-gray-600 mb-4">
                  {currentConfig.geoJSONType === 'Point'
                    ? 'Click on the map to set a point location'
                    : 'Draw a polygon on the map to define the intervention area'
                  }
                </p>
                {/* Your map component will replace this div */}
                <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Map Component Goes Here</p>
                </div>
              </div>

              {/* OR Divider */}
              <div className="flex items-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-gray-500 font-medium">OR</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* File Upload */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragOver ? 'border-green-400 bg-green-50' : 'border-gray-300'
                  } ${errors.geoJSONFile ? 'border-red-300' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleFileDrop}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2">Upload GeoJSON file</p>
                <p className="text-sm text-gray-500 mb-4">
                  Drag and drop your file here, or click to browse
                </p>
                <input
                  type="file"
                  accept=".geojson,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="geojson-upload"
                />
                <label
                  htmlFor="geojson-upload"
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Choose File
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Maximum file size: {VALIDATION_CONFIG.fileSize.maxMB}MB
                </p>
              </div>

              {/* File Preview */}
              {formData.geoJSONFile && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {formData.geoJSONFile.name}
                    </span>
                    <span className="text-sm text-green-600">
                      ({(formData.geoJSONFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, geoJSONFile: null }))}
                      className="ml-auto text-green-600 hover:text-green-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {errors.location && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.location}
                </p>
              )}
              {errors.geoJSONFile && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.geoJSONFile}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tree Registration Details */}
        {currentConfig.allowsTreeRegistration && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-amber-900 mb-4 flex items-center gap-2">
              <TreePine className="w-5 h-5" />
              Tree Registration Details
            </h3>

            {formData.interventionType === 'single-tree-registration' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tree Tag <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.treeDetails.tag}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      treeDetails: { ...prev.treeDetails, tag: e.target.value }
                    }))}
                    placeholder="Enter tree identifier"
                    maxLength={VALIDATION_CONFIG.treeTag.maxLength}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.treeTag ? 'border-red-300' : 'border-gray-300'
                      }`}
                  />
                  {errors.treeTag && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.treeTag}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Planting Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.treeDetails.plantingDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      treeDetails: { ...prev.treeDetails, plantingDate: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={formData.treeDetails.height}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      treeDetails: { ...prev.treeDetails, height: e.target.value }
                    }))}
                    placeholder="Tree height"
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Width/DBH (cm)
                  </label>
                  <input
                    type="number"
                    value={formData.treeDetails.width}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      treeDetails: { ...prev.treeDetails, width: e.target.value }
                    }))}
                    placeholder="Diameter at breast height"
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            ) : (
              // Multi-tree registration
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Trees Planted <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.treeDetails.count}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      treeDetails: { ...prev.treeDetails, count: parseInt(e.target.value) || 0 }
                    }))}
                    placeholder="Enter number of trees"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Planting Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.treeDetails.plantingDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      treeDetails: { ...prev.treeDetails, plantingDate: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the intervention activities, goals, and any relevant details..."
            maxLength={VALIDATION_CONFIG.description.maxLength}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none ${errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
          />
          <div className="flex justify-between mt-1">
            <div>
              {errors.description && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description}
                </p>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {formData.description.length}/{VALIDATION_CONFIG.description.maxLength}
            </p>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Intervention Image (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 mb-2">Upload an image of the intervention</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.files[0] }))}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <Camera className="w-4 h-4 mr-2" />
              Choose Image
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Supports JPG, PNG, WebP formats
            </p>
          </div>

          {formData.image && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  {formData.image.name}
                </span>
                <span className="text-sm text-green-600">
                  ({(formData.image.size / 1024 / 1024).toFixed(2)} MB)
                </span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                  className="ml-auto text-green-600 hover:text-green-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            onClick={() => {
              // Reset form or navigate back
              if (window.confirm('Are you sure you want to cancel? All changes will be lost.')) {
                // Handle cancel action
                console.log('Form cancelled');
              }
            }}
          >
            Cancel
          </button>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="px-6 py-3 border border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors"
              onClick={() => {
                // Save as draft functionality
                console.log('Saving as draft...');
              }}
            >
              Save as Draft
            </button>

            <button
              type="submit"
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <TreePine className="w-4 h-4" />
              Create Intervention
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default InterventionCreator;