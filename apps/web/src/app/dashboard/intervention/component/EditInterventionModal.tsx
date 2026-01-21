'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Info,
  MapPin,
  Leaf,
  Camera,
  Layers,
  Loader,
  AlertTriangle,
  Check,
  Plus,
  Minus,
  Search,
  Trash2,
  Upload,
  Trees,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  editInterventionComprehensive,
  preValidateInterventionEdit,
  getSciencetificSpecies,
  generatePreSignUrl,
} from '@shared-core/fetchApi/api.fetch';
import UnifiedMapComponent from '@/component/MapSelect';

// Tab configuration
const TABS = [
  { id: 'basic', label: 'Basic Info', icon: Info },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'species', label: 'Species', icon: Leaf },
  { id: 'image', label: 'Image', icon: Camera },
  { id: 'site', label: 'Site', icon: Layers },
];

interface EditInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  intervention: any;
  accessToken: string;
  selectedProject: string;
  sites: any[];
  onSaveComplete: (updatedIntervention: any) => void;
}

interface SpeciesChange {
  uid?: string;
  scientificSpeciesId?: number;
  isUnknown: boolean;
  speciesName?: string;
  commonName?: string;
  speciesCount: number;
  action: 'add' | 'update' | 'remove';
  reassignToSpeciesUid?: string;
}

interface ValidationError {
  code: string;
  message: string;
  details?: any;
}

// Species Reassign Modal Component
const SpeciesReassignModal = ({
  isOpen,
  onClose,
  speciesBeingRemoved,
  availableSpecies,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  speciesBeingRemoved: {
    uid: string;
    speciesName: string;
    treeCount: number;
    treeHids: string[];
  } | null;
  availableSpecies: any[];
  onConfirm: (reassignToSpeciesUid: string) => void;
}) => {
  const [selectedSpecies, setSelectedSpecies] = useState<string>('');
  const [showAllTrees, setShowAllTrees] = useState(false);

  if (!isOpen || !speciesBeingRemoved) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Reassign Trees</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-900">
                  "{speciesBeingRemoved.speciesName}" has {speciesBeingRemoved.treeCount} registered trees
                </h4>
                <p className="mt-1 text-sm text-amber-700">
                  Select a species to reassign these trees to before removal.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Reassign trees to:
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableSpecies.map((species) => (
                <label
                  key={species.uid}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedSpecies === species.uid
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reassignSpecies"
                    value={species.uid}
                    checked={selectedSpecies === species.uid}
                    onChange={() => setSelectedSpecies(species.uid)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">
                      {species.speciesName || 'Unknown Species'}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      (current count: {species.count})
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {speciesBeingRemoved.treeHids.length > 0 && (
            <div className="text-sm">
              <button
                onClick={() => setShowAllTrees(!showAllTrees)}
                className="text-blue-600 hover:text-blue-800"
              >
                {showAllTrees ? 'Hide' : 'Show'} affected trees ({speciesBeingRemoved.treeHids.length})
              </button>
              {showAllTrees && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono max-h-20 overflow-y-auto">
                  {speciesBeingRemoved.treeHids.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedSpecies)}
            disabled={!selectedSpecies}
            className="flex-1 px-4 py-2 bg-[#007A49] text-white rounded-lg hover:bg-[#006B3F] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reassign & Remove
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function EditInterventionModal({
  isOpen,
  onClose,
  intervention,
  accessToken,
  selectedProject,
  sites,
  onSaveComplete,
}: EditInterventionModalProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    interventionStartDate: '',
    interventionEndDate: '',
    description: '',
    geometry: null as any,
    species: [] as any[],
    image: null as string | null,
    siteUid: null as string | null,
  });

  // Track changes
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());
  const [speciesChanges, setSpeciesChanges] = useState<SpeciesChange[]>([]);

  // Species search state
  const [speciesSearchQuery, setSpeciesSearchQuery] = useState('');
  const [speciesSearchResults, setSpeciesSearchResults] = useState<any[]>([]);
  const [isSearchingSpecies, setIsSearchingSpecies] = useState(false);
  const [showSpeciesSearch, setShowSpeciesSearch] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Species reassign modal state
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [speciesBeingRemoved, setSpeciesBeingRemoved] = useState<any>(null);

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && intervention) {
      const startDate = intervention.interventionStartDate
        ? new Date(intervention.interventionStartDate).toISOString().split('T')[0]
        : '';
      const endDate = intervention.interventionEndDate
        ? new Date(intervention.interventionEndDate).toISOString().split('T')[0]
        : '';

      setFormData({
        interventionStartDate: startDate,
        interventionEndDate: endDate,
        description: intervention.description || '',
        geometry: intervention.originalGeometry || null,
        species: intervention.species?.map((s: any) => ({
          uid: s.uid,
          speciesName: s.speciesName,
          commonName: s.commonName,
          count: s.count,
          scientificSpeciesId: s.scientificSpeciesId,
          isUnknown: s.isUnknown || false,
        })) || [],
        image: intervention.image || null,
        siteUid: intervention.site?.uid || null,
      });
      setChangedFields(new Set());
      setSpeciesChanges([]);
      setValidationErrors([]);
      setIsDirty(false);
      setActiveTab('basic');
      setImageFile(null);
      setImagePreview(null);
    }
  }, [isOpen, intervention]);

  // Handle field changes
  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setChangedFields((prev) => new Set(prev).add(field));
    setIsDirty(true);
    setValidationErrors([]); // Clear validation errors on change
  };

  // Handle species count change
  const handleSpeciesCountChange = (speciesUid: string, newCount: number) => {
    if (newCount < 1) return;

    setFormData((prev) => ({
      ...prev,
      species: prev.species.map((s) =>
        s.uid === speciesUid ? { ...s, count: newCount } : s
      ),
    }));

    // Update species changes
    const existingChangeIdx = speciesChanges.findIndex(
      (c) => c.uid === speciesUid && c.action !== 'remove'
    );
    if (existingChangeIdx >= 0) {
      setSpeciesChanges((prev) => {
        const updated = [...prev];
        updated[existingChangeIdx] = { ...updated[existingChangeIdx], speciesCount: newCount };
        return updated;
      });
    } else {
      const species = formData.species.find((s) => s.uid === speciesUid);
      if (species) {
        setSpeciesChanges((prev) => [
          ...prev,
          {
            uid: speciesUid,
            isUnknown: species.isUnknown,
            speciesCount: newCount,
            action: 'update',
          },
        ]);
      }
    }
    setIsDirty(true);
  };

  // Handle species removal
  const handleRemoveSpecies = async (speciesUid: string) => {
    const species = formData.species.find((s) => s.uid === speciesUid);
    if (!species) return;

    // Check if species has trees (we'll validate on backend, but show modal proactively)
    // For now, just mark for removal - validation will catch tree issues
    const otherSpecies = formData.species.filter((s) => s.uid !== speciesUid);

    if (otherSpecies.length === 0) {
      toast.error('Cannot remove the last species. Add another species first.');
      return;
    }

    // Mark species for removal
    setSpeciesChanges((prev) => [
      ...prev.filter((c) => c.uid !== speciesUid),
      {
        uid: speciesUid,
        isUnknown: species.isUnknown,
        speciesCount: species.count,
        action: 'remove',
      },
    ]);

    setFormData((prev) => ({
      ...prev,
      species: prev.species.filter((s) => s.uid !== speciesUid),
    }));

    setIsDirty(true);
  };

  // Handle species search
  const handleSpeciesSearch = useCallback(
    async (query: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (query.trim().length < 2) {
        setSpeciesSearchResults([]);
        return;
      }

      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearchingSpecies(true);
        try {
          const response = await getSciencetificSpecies(accessToken, query);
          setSpeciesSearchResults(response.data || []);
        } catch (error) {
          console.error('Species search error:', error);
          setSpeciesSearchResults([]);
        } finally {
          setIsSearchingSpecies(false);
        }
      }, 300);
    },
    [accessToken]
  );

  // Handle add species
  const handleAddSpecies = (selectedSpecies: any) => {
    // Check if already exists
    const exists = formData.species.some(
      (s) => s.scientificSpeciesId === selectedSpecies.id
    );
    if (exists) {
      toast.error('This species is already added');
      return;
    }

    const newSpecies = {
      uid: `temp_${Date.now()}`,
      speciesName: selectedSpecies.scientificName,
      commonName: selectedSpecies.commonName,
      count: 1,
      scientificSpeciesId: selectedSpecies.id,
      isUnknown: false,
    };

    setFormData((prev) => ({
      ...prev,
      species: [...prev.species, newSpecies],
    }));

    setSpeciesChanges((prev) => [
      ...prev,
      {
        scientificSpeciesId: selectedSpecies.id,
        isUnknown: false,
        speciesName: selectedSpecies.scientificName,
        commonName: selectedSpecies.commonName,
        speciesCount: 1,
        action: 'add',
      },
    ]);

    setShowSpeciesSearch(false);
    setSpeciesSearchQuery('');
    setSpeciesSearchResults([]);
    setIsDirty(true);
  };

  // Handle geometry change
  const handleGeometryChange = (geoJSON: any) => {
    handleFieldChange('geometry', geoJSON);
  };

  // Handle image upload
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setIsDirty(true);
  };

  // Upload image and get filename
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image;

    try {
      // Generate pre-signed URL
      const presignResponse = await generatePreSignUrl(accessToken, {
        fileName: String(new Date().getMilliseconds()),
        fileType: imageFile.type,
        folder: 'intervention',
      });

      if (!presignResponse.uploadUrl) {
        throw new Error('Failed to get upload URL');
      }

      // Create form data for upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', imageFile);

      // Upload to S3/CDN
      const uploadResponse = await fetch(
        `/api/upload-image?uploadUrl=${encodeURIComponent(presignResponse.uploadUrl)}`,
        {
          method: 'PUT',
          body: uploadFormData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      return presignResponse.fileName;
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  // Validate before save
  const validateEdit = async () => {
    setIsValidating(true);
    setValidationErrors([]);

    try {
      const editData: any = {};

      // Only include changed fields
      if (changedFields.has('interventionStartDate')) {
        editData.interventionStartDate = formData.interventionStartDate;
      }
      if (changedFields.has('interventionEndDate')) {
        editData.interventionEndDate = formData.interventionEndDate;
      }
      if (changedFields.has('description')) {
        editData.description = formData.description;
      }
      if (changedFields.has('geometry')) {
        editData.geometry = formData.geometry;
      }
      if (changedFields.has('siteUid')) {
        editData.siteUid = formData.siteUid;
      }
      if (speciesChanges.length > 0) {
        editData.species = speciesChanges;
      }

      const result = await preValidateInterventionEdit(
        accessToken,
        intervention.uid,
        selectedProject,
        editData
      );

      // Handle nested response structure: result.data.data or result.data
      const validationData = result?.data?.data || result?.data;

      if (validationData && !validationData.valid) {
        setValidationErrors(validationData.errors || []);
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Validation error:', error);
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
      } else if (error.message) {
        setValidationErrors([{ code: 'UNKNOWN', message: error.message }]);
      } else {
        setValidationErrors([{ code: 'UNKNOWN', message: 'Validation failed' }]);
      }
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!isDirty) {
      onClose();
      return;
    }

    // Validate first
    const isValid = await validateEdit();
    if (!isValid) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    setIsSaving(true);

    try {
      // Upload image if changed
      let imageFileName = formData.image;
      if (imageFile) {
        imageFileName = await uploadImage();
        if (!imageFileName && imageFile) {
          setIsSaving(false);
          return; // Upload failed
        }
      }

      // Build edit data
      const editData: any = {};

      if (changedFields.has('interventionStartDate')) {
        editData.interventionStartDate = formData.interventionStartDate;
      }
      if (changedFields.has('interventionEndDate')) {
        editData.interventionEndDate = formData.interventionEndDate;
      }
      if (changedFields.has('description')) {
        editData.description = formData.description;
      }
      if (changedFields.has('geometry')) {
        editData.geometry = formData.geometry;
      }
      if (changedFields.has('siteUid')) {
        editData.siteUid = formData.siteUid;
      }
      if (speciesChanges.length > 0) {
        editData.species = speciesChanges;
      }
      if (imageFile || imageFileName !== intervention.image) {
        editData.image = imageFileName;
      }

      const result = await editInterventionComprehensive(
        accessToken,
        intervention.uid,
        selectedProject,
        editData
      );

      // Handle nested response structure
      const responseData = result?.data?.data || result?.data || result;
      const isSuccess = result?.success || result?.data?.success || responseData?.success;

      if (isSuccess) {
        toast.success('Intervention updated successfully');
        onSaveComplete(responseData?.intervention || intervention);
        onClose();
      } else {
        throw new Error(result?.message || responseData?.message || 'Failed to update intervention');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
      } else if (error.errors) {
        setValidationErrors(error.errors);
      }
      toast.error(error.message || 'Failed to update intervention');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (isSaving) return;
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Intervention</h2>
              <p className="text-sm text-gray-500">
                {intervention.type?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} - {intervention.hid}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-6">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#007A49] text-[#007A49]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-900">Validation Errors</h4>
                  <ul className="mt-2 space-y-1">
                    {validationErrors.map((error, idx) => (
                      <li key={idx} className="text-sm text-red-700">
                        {error.message}
                        {error.code === 'TREES_OUTSIDE_POLYGON' && error.details && (
                          <details className="mt-1">
                            <summary className="cursor-pointer text-red-600">
                              View affected trees ({error.details.length})
                            </summary>
                            <div className="mt-1 pl-4 text-xs max-h-20 overflow-y-auto">
                              {error.details.map((t: any, i: number) => (
                                <div key={i}>
                                  {t.treeHid} - {t.speciesName}
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.interventionStartDate}
                      onChange={(e) => handleFieldChange('interventionStartDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.interventionEndDate}
                      onChange={(e) => handleFieldChange('interventionEndDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    rows={4}
                    maxLength={2048}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent resize-none"
                    placeholder="Enter intervention description..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/2048 characters
                  </p>
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Location Editing</p>
                      <p>
                        Draw or edit the intervention boundary on the map. If this intervention has
                        registered trees, ensure all trees remain within the new boundary.
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ width: '100%', height: '50vh' }} className="rounded-lg overflow-hidden border border-gray-200">
                  <UnifiedMapComponent
                    updateGeoJSON={handleGeometryChange}
                    uploadedGeoJSON={formData.geometry}
                    mode={formData.geometry?.type === 'Polygon' ? 'polygon' : 'point'}
                  />
                </div>
              </div>
            )}

            {/* Species Tab */}
            {activeTab === 'species' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">
                    Species ({formData.species.length})
                  </h3>
                  <button
                    onClick={() => setShowSpeciesSearch(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-[#007A49] text-white rounded-lg hover:bg-[#006B3F]"
                  >
                    <Plus size={16} />
                    Add Species
                  </button>
                </div>

                {/* Species Search */}
                {showSpeciesSearch && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={speciesSearchQuery}
                        onChange={(e) => {
                          setSpeciesSearchQuery(e.target.value);
                          handleSpeciesSearch(e.target.value);
                        }}
                        placeholder="Search species..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent"
                        autoFocus
                      />
                    </div>

                    {isSearchingSpecies && (
                      <div className="flex items-center justify-center py-4">
                        <Loader className="animate-spin h-5 w-5 text-gray-400" />
                      </div>
                    )}

                    {speciesSearchResults.length > 0 && (
                      <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                        {speciesSearchResults.map((species) => (
                          <button
                            key={species.id}
                            onClick={() => handleAddSpecies(species)}
                            className="w-full text-left p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {species.scientificName}
                            </div>
                            {species.commonName && (
                              <div className="text-xs text-gray-500">{species.commonName}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setShowSpeciesSearch(false);
                        setSpeciesSearchQuery('');
                        setSpeciesSearchResults([]);
                      }}
                      className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Species List */}
                <div className="space-y-3">
                  {formData.species.map((species) => (
                    <div
                      key={species.uid}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#007A49] rounded-lg flex items-center justify-center">
                          <Leaf className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {species.speciesName || 'Unknown Species'}
                          </div>
                          {species.commonName && (
                            <div className="text-xs text-gray-500">{species.commonName}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSpeciesCountChange(species.uid, species.count - 1)}
                            disabled={species.count <= 1}
                            className="p-1 rounded-md hover:bg-gray-200 disabled:opacity-50"
                          >
                            <Minus size={16} />
                          </button>
                          <input
                            type="number"
                            value={species.count}
                            onChange={(e) =>
                              handleSpeciesCountChange(species.uid, parseInt(e.target.value) || 1)
                            }
                            min={1}
                            className="w-16 text-center px-2 py-1 border border-gray-200 rounded-lg"
                          />
                          <button
                            onClick={() => handleSpeciesCountChange(species.uid, species.count + 1)}
                            className="p-1 rounded-md hover:bg-gray-200"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveSpecies(species.uid)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Remove species"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {formData.species.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Trees className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No species added yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Image Tab */}
            {activeTab === 'image' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervention Image
                  </label>

                  {/* Current/Preview Image */}
                  {(imagePreview || formData.image) && (
                    <div className="relative mb-4 w-full max-w-md">
                      <img
                        src={
                          imagePreview ||
                          `${process.env.NEXT_PUBLIC_CDN}/intervention/${formData.image}`
                        }
                        alt="Intervention"
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          handleFieldChange('image', null);
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {/* Upload Button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <Upload size={16} />
                    {formData.image || imagePreview ? 'Replace Image' : 'Upload Image'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: JPG, PNG, WebP. Max size: 10MB
                  </p>
                </div>
              </div>
            )}

            {/* Site Tab */}
            {activeTab === 'site' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Site
                  </label>
                  <select
                    value={formData.siteUid || ''}
                    onChange={(e) => handleFieldChange('siteUid', e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent"
                  >
                    <option value="">No Site (Unassigned)</option>
                    {sites.map((site) => (
                      <option key={site.uid} value={site.uid}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.siteUid && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Site</h4>
                    {(() => {
                      const selectedSite = sites.find((s) => s.uid === formData.siteUid);
                      return selectedSite ? (
                        <div className="text-sm text-gray-600">
                          <p>
                            <strong>Name:</strong> {selectedSite.name}
                          </p>
                          {selectedSite.description && (
                            <p>
                              <strong>Description:</strong> {selectedSite.description}
                            </p>
                          )}
                          {selectedSite.status && (
                            <p>
                              <strong>Status:</strong> {selectedSite.status}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500">Site information not available</p>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              {isDirty ? (
                <span className="text-amber-600">• Unsaved changes</span>
              ) : (
                <span>No changes</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isDirty || isSaving || isValidating}
                className="flex items-center gap-2 px-4 py-2 bg-[#007A49] text-white rounded-lg hover:bg-[#006B3F] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader className="animate-spin h-4 w-4" />
                    Saving...
                  </>
                ) : isValidating ? (
                  <>
                    <Loader className="animate-spin h-4 w-4" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Species Reassign Modal */}
        <SpeciesReassignModal
          isOpen={reassignModalOpen}
          onClose={() => {
            setReassignModalOpen(false);
            setSpeciesBeingRemoved(null);
          }}
          speciesBeingRemoved={speciesBeingRemoved}
          availableSpecies={formData.species.filter(
            (s) => s.uid !== speciesBeingRemoved?.uid
          )}
          onConfirm={(reassignToUid) => {
            if (speciesBeingRemoved) {
              setSpeciesChanges((prev) => [
                ...prev.filter((c) => c.uid !== speciesBeingRemoved.uid),
                {
                  uid: speciesBeingRemoved.uid,
                  isUnknown: false,
                  speciesCount: 0,
                  action: 'remove',
                  reassignToSpeciesUid: reassignToUid,
                },
              ]);
              setFormData((prev) => ({
                ...prev,
                species: prev.species.filter((s) => s.uid !== speciesBeingRemoved.uid),
              }));
              setIsDirty(true);
            }
            setReassignModalOpen(false);
            setSpeciesBeingRemoved(null);
          }}
        />
      </div>
    </AnimatePresence>
  );
}
