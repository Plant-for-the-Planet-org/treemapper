import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  TreePine,
  Hash,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Minus,
  Info
} from 'lucide-react';
import { getSciencetificSpecies, updateInterventionSpecies } from '@shared-core/fetchApi/api.fetch';

// Types based on your schema
interface ScientificSpecies {
  id: number;
  uid: string;
  scientificName: string;
  commonName?: string;
  family?: string;
  genus?: string;
  species?: string;
}

interface InterventionSpecies {
  id: number;
  uid: string;
  scientificSpeciesId?: number;
  speciesName?: string;
  commonName?: string;
  count: number;
  isUnknown: boolean;
}

interface EditSpeciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  species: InterventionSpecies | null;
  accessToken: string
  interventionId: string
  selectedProject: string
}

interface ValidationError {
  code: string;
  message: string;
  currentTreeCount?: number;
  requestedSpeciesCount?: number;
  treeHids?: string[];
}

const EditSpeciesModal: React.FC<EditSpeciesModalProps> = ({
  isOpen,
  onClose,
  species,
  accessToken,
  interventionId,
  selectedProject,
}) => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ScientificSpecies[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<ScientificSpecies | null>(null);
  const [count, setcount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [validationError, setValidationError] = useState<ValidationError | null>(null);
  const [generalError, setGeneralError] = useState<string>('');

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();



  // Initialize form when species changes
  useEffect(() => {
    if (species && isOpen) {
      setcount(species.count);
      setSearchQuery('');
      setSelectedSpecies(null);
      setSearchResults([]);
      setShowResults(false);
      setValidationError(null);
      setGeneralError('');

      // If species has scientific data, set it as selected
      if (species.scientificSpeciesId && species.speciesName) {
        setSelectedSpecies({
          id: species.scientificSpeciesId,
          uid: '', // We don't have this from intervention species
          scientificName: species.speciesName,
          commonName: species.commonName
        });
      }
    }
  }, [species, isOpen]);

  // Debounced search
  useEffect(() => {
    handleSearch(accessToken, searchQuery)
  }, [searchQuery]);

  const handleSearch = (token, search) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (search.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const response = await getSciencetificSpecies(token, search)
          if (response.statusCode !== 200) {
            throw ''
          }
          setSearchResults(response.data);
          setShowResults(true);
        } catch (error) {
          console.error('Search failed:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }


  // const handleSave = async (data: { scientificSpeciesId: number; count: number }) => {
  //   // Simulate API call
  //   await new Promise(resolve => setTimeout(resolve, 1000));

  //   // Simulate validation error for demonstration
  //   if (data.count < 20) {
  //     const error = new Error('Species count cannot be less than existing tree count') as any;
  //     error.code = 'TREE_COUNT_EXCEEDS_SPECIES_COUNT';
  //     error.currentTreeCount = 20;
  //     error.requestedcount = data.count;
  //     error.treeHids = ['TRE-001', 'TRE-002', 'TRE-003'];
  //     throw error;
  //   }

  //   console.log('Saving species update:', data);
  //   // Your actual API call would go here
  // };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSpeciesSelect = (selectedSp: ScientificSpecies) => {
    setSelectedSpecies(selectedSp);
    setSearchQuery('');
    setShowResults(false);
    setValidationError(null);
    setGeneralError('');
    setIsSearching(false)
  };

  const handleCountChange = (newCount: number) => {
    if (newCount >= 0) {
      setcount(newCount);
      setValidationError(null);
      setGeneralError('');
    }
  };

  const handleSave = async () => {
    if (!selectedSpecies) {
      setGeneralError('Please select a species before saving');
      return;
    }

    if (count <= 0) {
      setGeneralError('Species count must be greater than 0');
      return;
    }

    setIsSaving(true);
    setValidationError(null);
    setGeneralError('');

    try {
      console.log("SDC",species)
      const resp = await updateInterventionSpecies(accessToken, {
        scientificSpeciesId: selectedSpecies.id,
        speciesCount: count
      }, selectedProject, interventionId, species.uid)

      if (resp.statusCode !== 200 && resp.statusCode !== 201) {
        throw ''
      }
      onClose();
    } catch (error: any) {
      console.error('Save failed:', error);

      // Handle specific validation errors from your service
      if (error.code === 'TREE_COUNT_EXCEEDS_SPECIES_COUNT') {
        setValidationError({
          code: error.code,
          message: error.message || 'Species count cannot be less than existing tree count',
          currentTreeCount: error.currentTreeCount,
          requestedSpeciesCount: error.requestedSpeciesCount,
          treeHids: error.treeHids
        });
      } else {
        setGeneralError(error.message || 'Failed to update species. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  if (!isOpen || !species) return null;

  return (
    <div className="fixed inset-0 bg-black/10 bg-opacity-10  backdrop-blur-sm z-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <TreePine className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Edit Species</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Current Species Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Current Species</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TreePine className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-900">
                  {species.speciesName || 'Unknown Species'}
                </span>
              </div>
              {species.commonName && (
                <div className="text-sm text-gray-600 ml-6">
                  {species.commonName}
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-900">
                  Current Count: {species.count}
                </span>
              </div>
            </div>
          </div>

          {/* Species Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select New Species
            </label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by scientific name, common name, or family..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isSaving}
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 text-gray-400 animate-spin" />
                )}
              </div>

              {/* Search Results */}
              {showResults && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSpeciesSelect(result)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-green-50"
                        disabled={isSaving}
                      >
                        <div className="font-medium text-gray-900">
                          {result.scientificName}
                        </div>
                        {result.commonName && (
                          <div className="text-sm text-gray-600">
                            {result.commonName}
                          </div>
                        )}
                        {result.family && (
                          <div className="text-xs text-gray-500">
                            Family: {result.family}
                          </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-gray-500">
                      {isSearching ? 'Searching...' : 'No species found'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {searchQuery.length > 0 && searchQuery.length < 2 && (
              <p className="mt-1 text-xs text-gray-500">
                Type at least 2 characters to search
              </p>
            )}
          </div>

          {/* Selected Species Display */}
          {selectedSpecies && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-green-900">
                    Selected Species
                  </h4>
                  <div className="mt-1">
                    <div className="font-medium text-green-800">
                      {selectedSpecies.scientificName}
                    </div>
                    {selectedSpecies.commonName && (
                      <div className="text-sm text-green-700">
                        {selectedSpecies.commonName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Species Count */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Species Count
            </label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handleCountChange(count - 1)}
                disabled={count <= 1 || isSaving}
                className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="h-4 w-4" />
              </button>

              <input
                type="number"
                value={count}
                onChange={(e) => handleCountChange(parseInt(e.target.value) || 0)}
                min="1"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center"
                disabled={isSaving}
              />

              <button
                type="button"
                onClick={() => handleCountChange(count + 1)}
                disabled={isSaving}
                className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-900">
                    Validation Error
                  </h4>
                  <p className="mt-1 text-sm text-red-700">
                    {validationError.message}
                  </p>
                  {validationError.currentTreeCount !== undefined && (
                    <div className="mt-2 text-sm text-red-700">
                      <div>Current tree count: {validationError.currentTreeCount}</div>
                      <div>Requested count: {validationError.requestedSpeciesCount}</div>
                    </div>
                  )}
                  {validationError.treeHids && validationError.treeHids.length > 0 && (
                    <div className="mt-2">
                      <details className="text-sm">
                        <summary className="text-red-700 cursor-pointer">
                          View affected trees ({validationError.treeHids.length})
                        </summary>
                        <div className="mt-1 pl-4 text-red-600 font-mono text-xs max-h-20 overflow-y-auto">
                          {validationError.treeHids.join(', ')}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* General Error */}
          {generalError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-700">{generalError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Info Note */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-700">
                  Changing the species will update all associated trees to use the new species information.
                  The species count cannot be less than the number of existing trees.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedSpecies || count <= 0 || isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-[#007A49] border border-transparent rounded-lg hover:bg-[#007A49] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSpeciesModal