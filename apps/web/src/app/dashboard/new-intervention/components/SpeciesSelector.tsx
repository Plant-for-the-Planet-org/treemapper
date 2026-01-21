import React, { useState, useEffect, useCallback } from 'react';
import { Search, Leaf, X, AlertTriangle, AlertCircle, Plus, Minus } from 'lucide-react';
import { FormData, ValidationErrors, InterventionSpeciesEntry } from '../types';
import { VALIDATION_CONFIG } from '../constants';
import { debounce, generateUID } from '../utils';
import { getSciencetificSpecies } from '@shared-core/fetchApi/api.fetch';

interface SpeciesSelectorProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  currentConfig: any;
  errors: ValidationErrors;
  accessToken: string;
}

export const SpeciesSelector: React.FC<SpeciesSelectorProps> = ({
  formData,
  setFormData,
  currentConfig,
  errors,
  accessToken
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
    [accessToken]
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

  const handleIncrement = (speciesUid: string, currentCount: number) => {
    const newCount = currentCount + 1;
    handleUpdateCount(speciesUid, newCount);
  };

  const handleDecrement = (speciesUid: string, currentCount: number) => {
    if (currentCount > 1) {
      const newCount = currentCount - 1;
      handleUpdateCount(speciesUid, newCount);
    }
  };

  const handleCountInputChange = (speciesUid: string, value: string) => {
    // Allow empty string for better UX while typing
    if (value === '') {
      setFormData(prev => ({
        ...prev,
        species: prev.species.map(species =>
          species.uid === speciesUid
            ? { ...species, count: 0 } // Temporary 0 for empty input
            : species
        )
      }));
      return;
    }

    // Remove any non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue === '') {
      return;
    }

    const parsedValue = Number.parseInt(numericValue, 10);
    
    // Validate: must be a positive number
    if (!Number.isNaN(parsedValue) && parsedValue > 0) {
      handleUpdateCount(speciesUid, parsedValue);
    }
  };

  const handleCountInputBlur = (speciesUid: string, currentValue: number) => {
    // Ensure minimum value of 1 on blur if empty or invalid
    if (currentValue < 1 || Number.isNaN(currentValue)) {
      handleUpdateCount(speciesUid, 1);
    }
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
                        <div className="flex items-center gap-1 w-32">
                          <button
                            type="button"
                            onClick={() => handleDecrement(species.uid, species.count)}
                            disabled={species.count <= 1 || formData.interventionType === 'single-tree-registration'}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-600 disabled:hover:bg-transparent"
                            title="Decrease count"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={species.count === 0 ? '' : species.count}
                            onChange={(e) => handleCountInputChange(species.uid, e.target.value)}
                            onBlur={(e) => handleCountInputBlur(species.uid, Number.parseInt(e.target.value, 10) || 0)}
                            disabled={formData.interventionType === 'single-tree-registration'}
                            className="w-full px-2 py-1.5 text-sm text-center border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            min="1"
                          />
                          <button
                            type="button"
                            onClick={() => handleIncrement(species.uid, species.count)}
                            disabled={formData.interventionType === 'single-tree-registration'}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-600 disabled:hover:bg-transparent"
                            title="Increase count"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
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
                className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
              >
                Add Species
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnknownSpecies(false);
                  setUnknownSpeciesName('');
                }}
                className="bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
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
