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
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Shield,
  Target
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
    description: 'Direct seeding intervention allows multiple species but no tree registration',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'emerald'
  },
  'enrichment-planting': {
    allowsSpecies: true,
    allowsMultipleSpecies: true,
    requiresSpecies: true,
    allowsTreeRegistration: true,
    requiresTreeRegistration: true,
    description: 'Enrichment planting allows multiple species and requires tree registration',
    icon: <TreePine className="w-5 h-5" />,
    color: 'green'
  },
  'single-tree-registration': {
    allowsSpecies: true,
    allowsMultipleSpecies: false,
    requiresSpecies: true,
    allowsTreeRegistration: true,
    requiresTreeRegistration: true,
    geoJSONType: 'Point',
    description: 'Single tree registration allows single species and requires tree registration',
    icon: <Target className="w-5 h-5" />,
    color: 'blue'
  },
  'multi-tree-registration': {
    allowsSpecies: true,
    allowsMultipleSpecies: true,
    requiresSpecies: true,
    allowsTreeRegistration: true,
    requiresTreeRegistration: true,
    geoJSONType: 'Polygon',
    description: 'Multi-tree registration allows multiple species and requires tree registration',
    icon: <TreePine className="w-5 h-5" />,
    color: 'teal'
  },
  'fencing': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    description: 'Fencing intervention for site protection',
    icon: <Shield className="w-5 h-5" />,
    color: 'amber'
  },
  'maintenance': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    description: 'General maintenance activities',
    icon: <Plus className="w-5 h-5" />,
    color: 'purple'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Header with back button */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                <TreePine className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Create New Intervention
                </h1>
                <p className="text-slate-600">Add a new forest management intervention to your project</p>
              </div>
            </div>
          </div>

          {formData.projectId && (
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200/60">
              <Info className="w-4 h-4" />
              <span>
                Adding intervention to: <strong>{mockProjects.find(p => p.id === formData.projectId)?.name}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Project and Site Selection */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Info className="w-4 h-4 text-blue-600" />
              </div>
              Project Selection
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.projectId || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    projectId: parseInt(e.target.value) || null,
                    siteId: null
                  }))}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-white/50 ${errors.projectId ? 'border-red-300' : 'border-slate-200'
                    }`}
                >
                  <option value="">Select a project</option>
                  {mockProjects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
                {errors.projectId && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.projectId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Site (Optional)
                </label>
                <select
                  value={formData.siteId || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    siteId: parseInt(e.target.value) || null
                  }))}
                  disabled={!formData.projectId}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 ${!formData.projectId ? 'bg-slate-100/50' : 'bg-white/50'
                    } ${errors.siteId ? 'border-red-300' : 'border-slate-200'}`}
                >
                  <option value="">Select a site</option>
                  {availableSites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
                {errors.siteId && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.siteId}
                  </p>
                )}
              </div>
            </div>

            {/* Apply to Entire Site Option */}
            {formData.siteId && (
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200/60 rounded-xl p-6">
                <label className="flex items-center gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.applyToEntireSite}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      applyToEntireSite: e.target.checked,
                      geoJSON: null,
                      geoJSONFile: null
                    }))}
                    className="w-5 h-5 text-blue-600 border-blue-300 rounded-lg focus:ring-blue-500/20 focus:ring-4"
                  />
                  <div>
                    <span className="text-sm font-semibold text-blue-900">Apply to entire site</span>
                    <p className="text-sm text-blue-700">Use the complete site boundary for this intervention</p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Intervention Type Selection */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              Intervention Type
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {Object.entries(interventionConfigurations).map(([key, config]) => (
                <label
                  key={key}
                  className={`relative cursor-pointer group transition-all duration-200 ${
                    formData.interventionType === key 
                      ? 'scale-105' 
                      : 'hover:scale-102'
                  }`}
                >
                  <input
                    type="radio"
                    name="interventionType"
                    value={key}
                    checked={formData.interventionType === key}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      interventionType: e.target.value,
                      species: [],
                      unknownSpecies: [],
                      geoJSON: null,
                      geoJSONFile: null
                    }))}
                    className="sr-only"
                  />
                  <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.interventionType === key
                      ? `border-${config.color}-500 bg-${config.color}-50 shadow-lg shadow-${config.color}-500/20`
                      : 'border-slate-200 bg-white/50 hover:border-slate-300 hover:shadow-md'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        formData.interventionType === key
                          ? `bg-${config.color}-100 text-${config.color}-600`
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {config.icon}
                      </div>
                      <span className="font-medium text-slate-900">
                        {key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {currentConfig && (
              <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl p-6 border border-slate-200/60">
                <p className="text-slate-700 mb-4">{currentConfig.description}</p>
                <div className="flex flex-wrap gap-2">
                  {currentConfig.allowsSpecies && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full font-medium">
                      Species Tracking
                    </span>
                  )}
                  {currentConfig.allowsTreeRegistration && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                      Tree Registration
                    </span>
                  )}
                  {currentConfig.geoJSONType && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium">
                      {currentConfig.geoJSONType} Required
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Species Selection */}
          {currentConfig.allowsSpecies && (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-emerald-600" />
                </div>
                Species {currentConfig.requiresSpecies && <span className="text-red-500">*</span>}
              </h2>

              {/* Species Search */}
              <div className="relative mb-6">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      value={speciesSearch}
                      onChange={(e) => setSpeciesSearch(e.target.value)}
                      placeholder="Search for species..."
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-white/50"
                    />
                    {isSearching && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUnknownSpecies(true)}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                  >
                    Unknown Species
                  </button>
                </div>

                {/* Search Results */}
                {speciesResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {speciesResults.map(species => (
                      <button
                        key={species.uid}
                        type="button"
                        onClick={() => handleSpeciesSelect(species)}
                        className="w-full px-4 py-3 text-left hover:bg-emerald-50 flex items-center gap-3 transition-colors duration-150"
                      >
                        <Leaf className="w-4 h-4 text-emerald-500" />
                        <span className="text-slate-700">{species.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {speciesSearch.length > 0 && speciesResults.length === 0 && !isSearching && (
                  <div className="absolute z-20 w-full mt-2 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-xl p-4">
                    <p className="text-slate-500 text-sm">No species found. Try using the "Unknown Species" option.</p>
                  </div>
                )}
              </div>

              {/* Unknown Species Modal */}
              {showUnknownSpecies && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-8 w-96 shadow-2xl border border-slate-200">
                    <h3 className="text-xl font-semibold mb-6 text-slate-900">Add Unknown Species</h3>
                    <input
                      type="text"
                      value={unknownSpeciesName}
                      onChange={(e) => setUnknownSpeciesName(e.target.value)}
                      placeholder="Enter species name"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl mb-6 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                      maxLength={VALIDATION_CONFIG.customSpeciesName.maxLength}
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleAddUnknownSpecies}
                        disabled={!unknownSpeciesName.trim()}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:from-slate-300 disabled:to-slate-400 transition-all duration-200 font-medium"
                      >
                        Add Species
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowUnknownSpecies(false);
                          setUnknownSpeciesName('');
                        }}
                        className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all duration-200 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Species */}
              {(formData.species.length > 0 || formData.unknownSpecies.length > 0) && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Selected Species:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.species.map(species => (
                      <div key={species.uid} className="flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 px-4 py-2 rounded-full border border-emerald-200">
                        <Leaf className="w-3 h-3" />
                        <span className="text-sm font-medium">{species.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecies(species.uid)}
                          className="hover:text-emerald-600 transition-colors duration-150"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {formData.unknownSpecies.map(species => (
                      <div key={species.uid} className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-4 py-2 rounded-full border border-amber-200">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-sm font-medium">{species.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveUnknownSpecies(species.uid)}
                          className="hover:text-amber-600 transition-colors duration-150"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.species && (
                <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.species}
                </p>
              )}
            </div>
          )}

          {/* Location Selection */}
          {!formData.applyToEntireSite && (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                Location <span className="text-red-500">*</span>
              </h2>

              <div className="space-y-6">
                {/* Map Component Placeholder */}
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-gradient-to-br from-slate-50 to-slate-100">
                  <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Interactive Map</h3>
                  <p className="text-slate-600 mb-6">
                    {currentConfig.geoJSONType === 'Point'
                      ? 'Click on the map to set a point location'
                      : 'Draw a polygon on the map to define the intervention area'
                    }
                  </p>
                  {/* Your map component will replace this div */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 h-64 rounded-xl flex items-center justify-center border border-blue-200">
                    <p className="text-slate-600 font-medium">Map Component Goes Here</p>
                  </div>
                </div>

                {/* OR Divider */}
                <div className="flex items-center">
                  <div className="flex-1 border-t border-slate-300"></div>
                  <span className="px-6 text-slate-500 font-semibold bg-white rounded-full border border-slate-200">OR</span>
                  <div className="flex-1 border-t border-slate-300"></div>
                </div>

                {/* File Upload */}
                <div
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                    isDragOver 
                      ? 'border-emerald-400 bg-emerald-50 scale-102' 
                      : 'border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100'
                  } ${errors.geoJSONFile ? 'border-red-300' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleFileDrop}
                >
                  <Upload className="w-10 h-10 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-700 font-semibold mb-2">Upload GeoJSON file</p>
                  <p className="text-sm text-slate-500 mb-6">
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
                    className="inline-flex items-center px-6 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Choose File
                  </label>
                  <p className="text-xs text-slate-500 mt-3">
                    Maximum file size: {VALIDATION_CONFIG.fileSize.maxMB}MB
                  </p>
                </div>

                {/* File Preview */}
                {formData.geoJSONFile && (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-800">
                        {formData.geoJSONFile.name}
                      </span>
                      <span className="text-sm text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                        {(formData.geoJSONFile.size / 1024).toFixed(1)} KB
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, geoJSONFile: null }))}
                        className="ml-auto text-emerald-600 hover:text-emerald-800 p-1 hover:bg-emerald-100 rounded-lg transition-all duration-150"
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
            <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 backdrop-blur-sm border-2 border-amber-200/60 rounded-2xl p-8 shadow-lg">
              <h2 className="text-xl font-semibold text-amber-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <TreePine className="w-4 h-4 text-amber-600" />
                </div>
                Tree Registration Details
              </h2>

              {formData.interventionType === 'single-tree-registration' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
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
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-white/60 ${
                        errors.treeTag ? 'border-red-300' : 'border-amber-200'
                      }`}
                    />
                    {errors.treeTag && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.treeTag}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
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
                      className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-white/60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
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
                      className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-white/60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
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
                      className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-white/60"
                    />
                  </div>
                </div>
              ) : (
                // Multi-tree registration
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
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
                      className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-white/60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
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
                      className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-white/60"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-indigo-600" />
              </div>
              Description
            </h2>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the intervention activities, goals, and any relevant details..."
              maxLength={VALIDATION_CONFIG.description.maxLength}
              rows={5}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 resize-none bg-white/50 ${
                errors.description ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            <div className="flex justify-between mt-3">
              <div>
                {errors.description && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.description}
                  </p>
                )}
              </div>
              <p className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                {formData.description.length}/{VALIDATION_CONFIG.description.maxLength}
              </p>
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                <Camera className="w-4 h-4 text-pink-600" />
              </div>
              Intervention Image (Optional)
            </h2>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-gradient-to-br from-slate-50 to-slate-100">
              <Camera className="w-10 h-10 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-700 font-semibold mb-2">Upload an image of the intervention</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.files[0] }))}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="inline-flex items-center px-6 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Camera className="w-4 h-4 mr-2" />
                Choose Image
              </label>
              <p className="text-xs text-slate-500 mt-3">
                Supports JPG, PNG, WebP formats
              </p>
            </div>

            {formData.image && (
              <div className="mt-4 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">
                    {formData.image.name}
                  </span>
                  <span className="text-sm text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                    {(formData.image.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                    className="ml-auto text-emerald-600 hover:text-emerald-800 p-1 hover:bg-emerald-100 rounded-lg transition-all duration-150"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                className="w-full sm:w-auto px-8 py-3 border-2 border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
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

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="button"
                  className="w-full sm:w-auto px-8 py-3 border-2 border-emerald-600 text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 hover:border-emerald-700 transition-all duration-200"
                  onClick={() => {
                    // Save as draft functionality
                    console.log('Saving as draft...');
                  }}
                >
                  Save as Draft
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-10 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <TreePine className="w-5 h-5" />
                  Create Intervention
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
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