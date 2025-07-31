'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Target,
  Ban,
  CloudRain,
  Dog,
  Eye,
  Flame,
  Grid3X3,
  MoreHorizontal,
  Mountain,
  MousePointer,
  Scissors,
  Trash2,
  Unlock,
  Wrench,
  Zap,
  CheckCircle,
  CheckCircleIcon,
  CheckCircle2Icon
} from 'lucide-react';
import useProjectStore from '@shared-core/store/useProjectStore'
import { useToken } from '@/context/useTokenContext';
import { getSciencetificSpecies, getUserProjectSites } from '@shared-core/fetchApi/api.fetch';
import ProjectMap from './component/InterventionSelectMap'
import GeoJSONFileUpload from '@/component/GeoJSONfileupload'
import InterventionUploadModal from './component/InterventionUploadModal';

// Validation configuration
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
    allowsSampleTrees: false,
    allowEntireSite: true,
    geometryType: ['point', 'polygon'],
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
    allowsSampleTrees: true,
    allowEntireSite: true,
    geometryType: ['point', 'polygon'],
    description: 'Enrichment planting allows multiple species and requires tree registration',
    icon: <TreePine className="w-5 h-5" />,
    color: 'green'
  },
  'removal-invasive-species': {
    allowsSpecies: true,
    allowsMultipleSpecies: true,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    allowEntireSite: true,
    geometryType: ['point', 'polygon'],
    description: 'Removal of invasive species can track multiple species being removed',
    icon: <Trash2 className="w-5 h-5" />,
    color: 'red'
  },
  'multi-tree-registration': {
    allowsSpecies: true,
    allowsMultipleSpecies: true,
    requiresSpecies: true,
    allowsTreeRegistration: true,
    requiresTreeRegistration: true,
    allowsSampleTrees: true,
    allowEntireSite: true,
    geometryType: ['point', 'polygon'],
    geoJSONType: 'Polygon',
    description: 'Multi-tree registration allows multiple species and requires tree registration',
    icon: <TreePine className="w-5 h-5" />,
    color: 'teal'
  },
  'single-tree-registration': {
    allowsSpecies: true,
    allowsMultipleSpecies: false,
    requiresSpecies: true,
    allowsTreeRegistration: true,
    requiresTreeRegistration: true,
    allowsSampleTrees: false,
    geoJSONType: 'Point',
    description: 'Single tree registration allows single species and requires tree registration',
    icon: <Target className="w-5 h-5" />,
    color: 'blue'
  },
  'fencing': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Fencing intervention for site protection',
    icon: <Shield className="w-5 h-5" />,
    color: 'amber'
  },
  'fire-patrol': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Fire patrol and prevention activities',
    icon: <Eye className="w-5 h-5" />,
    color: 'orange'
  },
  'fire-suppression': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Fire suppression activities',
    icon: <Flame className="w-5 h-5" />,
    color: 'red'
  },
  'firebreaks': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Creating firebreaks for fire prevention',
    icon: <Zap className="w-5 h-5" />,
    color: 'yellow'
  },
  'grass-suppression': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Grass suppression activities',
    icon: <Scissors className="w-5 h-5" />,
    color: 'lime'
  },
  'liberating-regenerant': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Liberating natural regenerants',
    icon: <Unlock className="w-5 h-5" />,
    color: 'cyan'
  },
  'maintenance': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'General maintenance activities',
    icon: <Wrench className="w-5 h-5" />,
    color: 'purple'
  },
  'marking-regenerant': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Marking natural regenerants',
    icon: <MapPin className="w-5 h-5" />,
    color: 'pink'
  },
  'other-intervention': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Other types of interventions',
    icon: <MoreHorizontal className="w-5 h-5" />,
    color: 'slate'
  },
  'soil-improvement': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Soil improvement activities',
    icon: <Mountain className="w-5 h-5" />,
    color: 'stone'
  },
  'stop-tree-harvesting': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Stopping tree harvesting activities',
    icon: <Ban className="w-5 h-5" />,
    color: 'red'
  },
  'assisting-seed-rain': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Assisting natural seed rain processes',
    icon: <CloudRain className="w-5 h-5" />,
    color: 'sky'
  },
  'control-livestock': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Livestock control measures',
    icon: <Dog className="w-5 h-5" />,
    color: 'brown'
  }
};

// Types
interface InterventionSpeciesEntry {
  uid: string;
  scientificSpeciesId?: number | null;
  scientificSpeciesUid?: string | null;
  speciesName?: string;
  isUnknown: boolean;
  otherSpeciesName?: string | null;
  count: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

interface FormData {
  projectId: string | null;
  siteId: string | null;
  interventionType: string;
  species: InterventionSpeciesEntry[];
  description: string;
  geoJSON: any;
  geoJSONFile: File | null;
  applyToEntireSite: boolean;
  treeDetails: {
    tag: string;
    height: string;
    width: string;
    plantingDate: string;
  };
  image: File | null;
}

interface ValidationErrors {
  [key: string]: string;
}

// Mock data for demonstration
const mockProjects = [
  { uid: 'proj1', projectName: 'Forest Restoration Project A' },
  { uid: 'proj2', projectName: 'Urban Tree Planting Initiative' }
];

const mockSites = [
  { id: 'site1', name: 'Site Alpha', projectId: 'proj1' },
  { id: 'site2', name: 'Site Beta', projectId: 'proj1' }
];

// Mock API functions
const mockSearchSpecies = async (query: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    { uid: 'sp1', id: 1, scientificName: 'Quercus alba', commonName: 'White Oak' },
    { uid: 'sp2', id: 2, scientificName: 'Acer rubrum', commonName: 'Red Maple' },
    { uid: 'sp3', id: 3, scientificName: 'Pinus strobus', commonName: 'White Pine' }
  ].filter(species =>
    species.scientificName.toLowerCase().includes(query.toLowerCase()) ||
    species.commonName.toLowerCase().includes(query.toLowerCase())
  );
};

// Utility functions
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function generateUID() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function validateTreeMeasurement(value: string, label: string) {
  const numValue = parseFloat(value);

  if (isNaN(numValue)) {
    return {
      isValid: false,
      error: `${label} must be a valid number`
    };
  }

  const decimalPlaces = (value.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return {
      isValid: false,
      error: `${label} can have maximum 2 decimal places`
    };
  }

  if (numValue <= 0) {
    return {
      isValid: false,
      error: `${label} must be greater than 0`
    };
  }

  if (numValue > 200) {
    return {
      isValid: false,
      error: `${label} cannot exceed 200 meters`
    };
  }

  return {
    isValid: true,
    value: numValue
  };
}

// ===================== COMPONENT: Project and Site Selection =====================
const ProjectSiteSelector = ({
  formData,
  setFormData,
  errors,
  projects,
  sites,
  fetchingSites
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: ValidationErrors;
  projects: any[];
  sites: any[];
  fetchingSites: boolean;
}) => {

  return (
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
          <input
            type="text"
            value={projects.projectName ? projects.projectName : 'No project available'}
            disabled
            className="w-full px-4 py-3 border-2 rounded-xl bg-slate-100/80 text-slate-600 border-slate-200 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Site (Optional)
          </label>
          <select
            value={formData.siteId || ''}
            onChange={(e) => {
              setFormData(prev => ({
                ...prev,
                siteId: e.target.value || null
              }))
            }}
            disabled={!formData.projectId || sites.length === 0}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 ${!formData.projectId ? 'bg-slate-100/50' : 'bg-white/50'
              } ${errors.siteId ? 'border-red-300' : 'border-slate-200'}`}
          >
            <option value="">
              {fetchingSites ? "Loading sites..." : sites.length === 0 ? "No sites found" : "Select site"}
            </option>
            {sites.map(site => (
              <option key={site.uid} value={site.uid}>{site.name}</option>
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

      {/* {formData.siteId && (
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
      )} */}
    </div>
  );
};

// ===================== COMPONENT: Intervention Type Selection =====================
const InterventionTypeSelector = ({
  formData,
  setFormData
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}) => {
  const currentConfig = interventionConfigurations[formData.interventionType];

  return (
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
            className={`relative cursor-pointer group transition-all duration-200 ${formData.interventionType === key ? 'scale-105' : 'hover:scale-102'
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
                geoJSON: null,
                geoJSONFile: null
              }))}
              className="sr-only"
            />
            <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${formData.interventionType === key
              ? `border-${config.color}-500 bg-${config.color}-50 shadow-lg shadow-${config.color}-500/20`
              : 'border-slate-200 bg-white/50 hover:border-slate-300 hover:shadow-md'
              }`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${formData.interventionType === key
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
  );
};

// ===================== COMPONENT: Species Selector =====================
const SpeciesSelector = ({
  formData,
  setFormData,
  currentConfig,
  errors,
  accessToken
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  currentConfig: any;
  errors: ValidationErrors;
  accessToken: string
}) => {
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [speciesResults, setSpeciesResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showUnknownSpecies, setShowUnknownSpecies] = useState(false);
  const [unknownSpeciesName, setUnknownSpeciesName] = useState('');

  // Debounced species search
  const debounceSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length > 0) {
        setIsSearching(true);
        try {
          const response = await getSciencetificSpecies(accessToken, query);
          if (response.data) {
            setSpeciesResults(response.data);
          }
        } catch (error) {
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

  const handleSpeciesSelect = (species: any) => {
    const newSpeciesEntry: InterventionSpeciesEntry = {
      uid: generateUID(),
      scientificSpeciesId: species.id,
      scientificSpeciesUid: species.uid,
      speciesName: species.scientificName,
      isUnknown: false,
      otherSpeciesName: null,
      count: 1,
      createdAt: new Date().toISOString()
    };

    if (!currentConfig.allowsMultipleSpecies && formData.species.length > 0) {
      setFormData(prev => ({ ...prev, species: [newSpeciesEntry] }));
    } else {
      const exists = formData.species.find(s => s.scientificSpeciesUid === species.uid);
      if (!exists) {
        setFormData(prev => ({
          ...prev,
          species: [...prev.species, newSpeciesEntry]
        }));
      }
    }
    setSpeciesSearch('');
    setSpeciesResults([]);
  };

  const handleAddUnknownSpecies = () => {
    if (unknownSpeciesName.trim()) {
      const newSpeciesEntry: InterventionSpeciesEntry = {
        uid: generateUID(),
        isUnknown: true,
        otherSpeciesName: unknownSpeciesName.trim(),
        speciesName: unknownSpeciesName.trim(),
        scientificSpeciesId: null,
        scientificSpeciesUid: null,
        count: 1,
        createdAt: new Date().toISOString()
      };

      if (!currentConfig.allowsMultipleSpecies) {
        setFormData(prev => ({ ...prev, species: [newSpeciesEntry] }));
      } else {
        setFormData(prev => ({
          ...prev,
          species: [...prev.species, newSpeciesEntry]
        }));
      }

      setUnknownSpeciesName('');
      setShowUnknownSpecies(false);
    }
  };

  const handleRemoveSpecies = (speciesUid: string) => {
    setFormData(prev => ({
      ...prev,
      species: prev.species.filter(s => s.uid !== speciesUid)
    }));
  };

  const handleUpdateCount = (speciesUid: string, newCount: number) => {
    let adjustedCount = newCount;
    if (formData.interventionType === 'single-tree-registration') {
      adjustedCount = 1;
      // You could add a toast notification here
    }

    setFormData(prev => ({
      ...prev,
      species: prev.species.map(species =>
        species.uid === speciesUid
          ? { ...species, count: Math.max(1, adjustedCount) }
          : species
      )
    }));
  };

  if (!currentConfig.allowsSpecies) return null;

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8" style={{ paddingBottom: speciesResults.length > 0 || showUnknownSpecies ? 240 : 0 }}>
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
            className="px-6 py-3 bg-black text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
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
                <div>
                  <span className="text-slate-700 font-medium">{species.scientificName}</span>
                  {species.commonName && (
                    <span className="text-slate-500 text-sm ml-2">({species.commonName})</span>
                  )}
                </div>
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

      {/* Selected Species Table */}
      {formData.species.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-700">Selected Species:</p>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Species</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Count</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {formData.species.map((species) => (
                    <tr key={species.uid} className="hover:bg-emerald-50/50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${species.isUnknown ? 'bg-amber-100' : 'bg-emerald-100'
                            }`}>
                            {species.isUnknown ? (
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                            ) : (
                              <Leaf className="w-4 h-4 text-emerald-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {species.isUnknown ? species.otherSpeciesName : species.speciesName}
                            </p>
                            {species.isUnknown && (
                              <p className="text-xs text-amber-600">Unknown species</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-24">
                          <input
                            type="number"
                            min="1"
                            value={species.count}
                            onChange={(e) => handleUpdateCount(species.uid, parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecies(species.uid)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-150"
                          title="Remove species"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200/60">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">
                  Total Species: {formData.species.length}
                </span>
                <span className="font-semibold text-slate-900">
                  Total Count: {formData.species.reduce((sum, species) => sum + species.count, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {errors.species && (
        <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {errors.species}
        </p>
      )}

      {/* Unknown Species Modal */}
      {showUnknownSpecies && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" style={{ borderRadius: 16 }}>
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
    </div>
  );
};

// ===================== COMPONENT: Location Selector (Placeholder) =====================
const LocationSelector = ({
  formData,
  setFormData,
  currentConfig,
  errors
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: ValidationErrors;
  currentConfig: any
}) => {
  const handleGeoJSONChange = (geoJson: any) => {
    setFormData(prev => ({ ...prev, geoJSON: geoJson }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file
      if (file.type !== 'application/json' && !file.name.endsWith('.geojson')) {
        // Handle error
        return;
      }

      const maxSize = VALIDATION_CONFIG.fileSize.maxMB * 1024 * 1024;
      if (file.size > maxSize) {
        // Handle error
        return;
      }

      setFormData(prev => ({ ...prev, geoJSONFile: file }));
    }
  };

  if (formData.applyToEntireSite) return null;

  return (
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
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 h-80 rounded-xl flex items-center justify-center border border-blue-200">
            <ProjectMap updateGeoJSON={handleGeoJSONChange} uploadedGeoJSON={formData.geoJSON} interventionType={formData.interventionType} />
          </div>
        </div>

        {/* OR Divider */}
        <div className="flex items-center">
          <div className="flex-1 border-t border-slate-300"></div>
          <span className="px-6 text-slate-500 font-semibold bg-white rounded-full border border-slate-200">OR</span>
          <div className="flex-1 border-t border-slate-300"></div>
        </div>

        {/* File Upload */}
        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-gradient-to-br from-slate-50 to-slate-100">
          <GeoJSONFileUpload onGeoJSONChange={handleGeoJSONChange} allowedGeometryTypes={
            currentConfig.type === 'single-tree-registration' ? 'point' : 'both'
          } />
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
      </div>
    </div>
  );
};

// ===================== COMPONENT: Tree Registration =====================
const TreeRegistration = ({
  formData,
  setFormData,
  currentConfig,
  errors
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  currentConfig: any;
  errors: ValidationErrors;
}) => {
  if (!currentConfig.allowsTreeRegistration) return null;

  const totalTreeCount = formData.species.reduce((sum, species) => sum + species.count, 0);

  return (
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
              Tree Tag
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
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-white/60 ${errors.treeTag ? 'border-red-300' : 'border-amber-200'
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
              Height (m)
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
              step="0.01"
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
              step="0.01"
              className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-white/60"
            />
          </div>
        </div>
      ) : (
        // Multi-tree registration
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Total Trees <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={totalTreeCount}
              disabled
              className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl bg-amber-50/50 text-slate-600"
            />
            <p className="text-xs text-amber-700 mt-1">Calculated from species counts above</p>
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
  );
};

// ===================== COMPONENT: Description =====================
const DescriptionInput = ({
  formData,
  setFormData,
  errors
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: ValidationErrors;
}) => {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
          <FileText className="w-4 h-4 text-indigo-600" />
        </div>
        Details (Optional)
      </h2>
      <textarea
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        placeholder="Describe the intervention or any relevant details..."
        maxLength={VALIDATION_CONFIG.description.maxLength}
        rows={5}
        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 resize-none bg-white/50 ${errors.description ? 'border-red-300' : 'border-slate-200'
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
  );
};

// ===================== COMPONENT: Image Upload =====================
const ImageUpload = ({
  formData,
  setFormData,
  fileInputRef
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  fileInputRef: any
}) => {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
          <Camera className="w-4 h-4 text-pink-600" />
        </div>
        {formData.interventionType === 'single-tree-registration' ? "Tree Image" : "Intervention Image (Optional)"}
        {formData.image ? <CheckCircle2Icon color='#007A49' /> : null}
      </h2>
      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Camera className="w-10 h-10 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-700 font-semibold mb-2">Upload an image of the intervention</p>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.files?.[0] || null }))}
          className="hidden"
          ref={fileInputRef}
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
              onClick={() => {
                setFormData(prev => ({ ...prev, image: null }))
                fileInputRef.current.value = null
              }}
              className="ml-auto text-emerald-600 hover:text-emerald-800 p-1 hover:bg-emerald-100 rounded-lg transition-all duration-150"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================== MAIN COMPONENT =====================
const InterventionCreator = ({ goBack }) => {
  // Form state
  const [formData, setFormData] = useState<FormData>({
    projectId: null,
    siteId: null,
    interventionType: 'single-tree-registration',
    species: [],
    description: '',
    geoJSON: null,
    geoJSONFile: null,
    applyToEntireSite: false,
    treeDetails: {
      tag: '',
      height: '',
      width: '',
      plantingDate: new Date().toISOString().split('T')[0]
    },
    image: null
  });

  // UI state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startUpload, setStartUpload] = useState(null)
  // Mock data - replace with actual API calls
  const [sites, setSites] = useState(mockSites.filter(site => site.projectId === formData.projectId));
  const [fetchingSites] = useState(false);
  const { accessToken } = useToken();
  const selectedProject = useProjectStore(state => state.selectedProject);

  useEffect(() => {
    if (selectedProject) {
      fetchAllSites()
    }
  }, [selectedProject])

  const fetchAllSites = async () => {
    const response = await getUserProjectSites(accessToken, selectedProject?.uid || '');
    if (response && response.statusCode === 200) {
      setFormData(prev => ({ ...prev, siteId: null, projectId: selectedProject?.uid || null }));
      setSites(response.data);
    }
  }

  const fileInputRef = useRef(null);


  // Get current intervention config
  const currentConfig = interventionConfigurations[formData.interventionType];

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Project validation
    if (!formData.projectId) {
      newErrors.projectId = 'Project is required';
    }

    // Species validation
    if (currentConfig.requiresSpecies && formData.species.length === 0) {
      newErrors.species = 'At least one species is required';
    }

    // Location validation
    if (!formData.applyToEntireSite && !formData.geoJSON && !formData.geoJSONFile) {
      newErrors.location = 'Location must be defined (map selection or file upload)';
    }

    // Site selection validation
    if (formData.applyToEntireSite && !formData.siteId) {
      newErrors.siteId = 'Site must be selected when applying to entire site';
    }

    // Tree registration validation
    if (currentConfig.allowsTreeRegistration && formData.interventionType === 'single-tree-registration') {

      if (!formData.image) {
        newErrors.image = `Tree Image is required`;
      }

      if (formData.treeDetails.tag.length > VALIDATION_CONFIG.treeTag.maxLength) {
        newErrors.treeTag = `Tree tag must not exceed ${VALIDATION_CONFIG.treeTag.maxLength} characters`;
      }

      if (!formData.treeDetails.height) {
        newErrors.treeHeight = "Tree Height is required"

      }

      if (!formData.treeDetails.height) {
        newErrors.treeWidth = "Tree Diameter is required"
      }


      if (formData.treeDetails.height && !validateTreeMeasurement(formData.treeDetails.height, 'Height').isValid) {
        newErrors.treeHeight = validateTreeMeasurement(formData.treeDetails.height, 'Height').error;
      }

      if (formData.treeDetails.width && !validateTreeMeasurement(formData.treeDetails.width, 'Width').isValid) {
        newErrors.treeWidth = validateTreeMeasurement(formData.treeDetails.width, 'Width').error;
      }
    }

    // Description validation
    if (formData.description.length > VALIDATION_CONFIG.description.maxLength) {
      newErrors.description = `Description must not exceed ${VALIDATION_CONFIG.description.maxLength} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Build API payload
  const buildApiPayload = () => {
    const totalTreeCount = formData.species.reduce((sum, species) => sum + species.count, 0);

    const payload: any = {
      type: formData.interventionType,
      captureMode: 'off-site',
      geometry: formData.geoJSON,
      registrationDate: new Date().toISOString(),
      metadata: { app: {}, public: {}, private: {} },
      plantProject: formData.projectId,
      treeCount: totalTreeCount,
      interventionStartDate: new Date(formData.treeDetails.plantingDate).toISOString(),
      interventionEndDate: new Date(formData.treeDetails.plantingDate).toISOString(),
    };

    if (formData.siteId) {
      payload.plantProjectSite = formData.siteId;
    }

    if (formData.description) {
      payload.description = formData.description;
    }

    // Handle species data according to intervention type
    if (formData.interventionType === 'single-tree-registration' && formData.species.length > 0) {
      const species = formData.species[0];
      payload.species = [{
        uid: species.uid,
        scientificSpeciesId: species.scientificSpeciesId || undefined,
        scientificSpeciesUid: species.scientificSpeciesUid || undefined,
        speciesName: species.speciesName || species.otherSpeciesName,
        isUnknown: species.isUnknown,
        count: 1,
        otherSpeciesName: species.otherSpeciesName || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }];

      // Add tree details for single tree registration
      payload.tag = formData.treeDetails.tag;
      payload.height = formData.treeDetails.height ? parseFloat(formData.treeDetails.height) : null;
      payload.width = formData.treeDetails.width ? parseFloat(formData.treeDetails.width) : null;
    } else if (formData.species.length > 0) {
      // For multi-tree registration or other types that support multiple species
      payload.species = formData.species.map(species => ({
        uid: species.uid,
        scientificSpeciesId: species.scientificSpeciesId,
        scientificSpeciesUid: species.scientificSpeciesUid,
        speciesName: species.speciesName || species.otherSpeciesName,
        isUnknown: species.isUnknown,
        otherSpeciesName: species.otherSpeciesName || null,
        count: species.count,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }

    return payload;
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }


    setIsSubmitting(true);

    try {
      const payload = buildApiPayload();
      // TODO: Replace with actual API call
      // const response = await createNewIntervention(accessToken, payload, formData.projectId);

      setStartUpload(payload)

      // Reset form or redirect
      // resetForm();

    } catch (error) {
      // Handle specific error types
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-40">
        <div className="w-full mx-auto px-6 py-4">
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
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Create New Intervention
                </h1>
                <p className="text-slate-600">Add a new intervention to your project</p>
              </div>
            </div>
          </div>

          {formData.projectId && (
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200/60">
              <Info className="w-4 h-4" />
              <span>
                Adding intervention to: <strong>{selectedProject?.projectName}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Project and Site Selection */}
          <ProjectSiteSelector
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            projects={selectedProject}
            sites={sites}
            fetchingSites={fetchingSites}
          />

          {/* Intervention Type Selection */}
          <InterventionTypeSelector
            formData={formData}
            setFormData={setFormData}
          />

          {/* Species Selection */}
          <SpeciesSelector
            formData={formData}
            setFormData={setFormData}
            currentConfig={currentConfig}
            errors={errors}
            accessToken={accessToken}
          />

          {/* Location Selection */}
          <LocationSelector
            formData={formData}
            setFormData={setFormData}
            currentConfig={currentConfig}
            errors={errors}
          />

          {/* Tree Registration Details */}
          <TreeRegistration
            formData={formData}
            setFormData={setFormData}
            currentConfig={currentConfig}
            errors={errors}
          />

          {/* Description */}
          <DescriptionInput
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />

          {/* Image Upload */}
          <ImageUpload
            formData={formData}
            setFormData={setFormData}
            fileInputRef={fileInputRef}
          />

          <InterventionUploadModal
            accessToken={accessToken}
            imageRef={fileInputRef}
            isOpen={startUpload !== null} onClose={() => { setStartUpload(null) }} onSuccess={goBack} formData={startUpload} image={formData.image} />

          {/* Form Actions */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8 ">
            <div className="flex  sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to cancel? All changes will be lost.')) {
                    window.history.back();
                  }
                }}
                className="w-full sm:w-auto px-8 py-3 border-2 border-slate-300 text-slate-600 rounded-xl font-semibold hover:bg-gray-50 hover:border-slate-400 transition-all duration-200"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer w-full sm:w-auto px-10 py-3 bg-green-700 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    Create Intervention
                  </>
                )}
              </button>
            </div>

            {/* Validation Summary */}
            {Object.keys(errors).length > 0 && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-800">Please fix the following errors:</span>
                </div>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {Object.values(errors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterventionCreator;