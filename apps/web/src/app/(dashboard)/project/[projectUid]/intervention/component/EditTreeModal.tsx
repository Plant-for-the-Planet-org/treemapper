'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Leaf,
  MapPin,
  Camera,
  Tag,
  Loader,
  AlertTriangle,
  Check,
  Upload,
  Search,
  CheckCircle,
  Info,
  Loader2,
  Activity,
  Heart,
  HeartOff,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  editTree,
  generatePreSignUrl,
  getSciencetificSpecies,
  addTreeRemeasurement,
} from '@shared-core/fetchApi/api.fetch';
import UnifiedMapComponent from '@/component/MapSelect';
import { cdnUrl } from '@/lib/cdn';

const SINGLE_TREE_TYPE = 'single-tree-registration';

interface ScientificSpecies {
  id: number;
  uid: string;
  scientificName: string;
  commonName?: string;
  family?: string;
}

interface InterventionSpecies {
  uid: string;
  scientificSpeciesId?: number;
  speciesName?: string;
  commonName?: string;
  count: number;
  isUnknown?: boolean;
}

interface Tree {
  id: string | number;
  hid: string;
  tag?: string;
  image?: string;
  status: string;
  speciesName?: string;
  commonName?: string;
  height?: number;
  width?: number;
  plantingDate?: string;
  location?: any;
  originalGeometry?: any;
  interventionSpeciesUid?: string;
  interventionSpeciesId?: number;
  scientificSpeciesId?: number;
}

interface Intervention {
  uid: string;
  hid: string;
  type: string;
  interventionStartDate?: string;
  originalGeometry?: any;
  species?: InterventionSpecies[];
}

interface EditTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tree: Tree;
  intervention: Intervention;
  accessToken: string;
  selectedProject: string;
  onSaveComplete: (updatedTree: any) => void;
}

const TABS = [
  { id: 'basic', label: 'Basic Info', icon: Tag },
  { id: 'species', label: 'Species', icon: Leaf },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'image', label: 'Image', icon: Camera },
  { id: 'remeasurement', label: 'Remeasurement', icon: Activity },
];

export default function EditTreeModal({
  isOpen,
  onClose,
  tree,
  intervention,
  accessToken,
  selectedProject,
  onSaveComplete,
}: EditTreeModalProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showDeadNotice, setShowDeadNotice] = useState(false);

  // Basic fields
  const [tag, setTag] = useState('');
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [plantingDate, setPlantingDate] = useState('');
  const [plantingDateError, setPlantingDateError] = useState('');

  // Species fields
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ScientificSpecies[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<ScientificSpecies | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedInterventionSpeciesUid, setSelectedInterventionSpeciesUid] = useState('');
  const [speciesError, setSpeciesError] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Location
  const [location, setLocation] = useState<any>(null);
  const [locationChanged, setLocationChanged] = useState(false);

  // Species changed flag
  const [speciesChanged, setSpeciesChanged] = useState(false);

  // Image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Remeasurement
  const [remStatus, setRemStatus] = useState<'alive' | 'dead' | ''>('');
  const [remHeight, setRemHeight] = useState('');
  const [remWidth, setRemWidth] = useState('');
  const [remUnit, setRemUnit] = useState<'m' | 'cm'>('m');
  const [remNotes, setRemNotes] = useState('');
  const [remImageFile, setRemImageFile] = useState<File | null>(null);
  const [remImagePreview, setRemImagePreview] = useState<string | null>(null);
  const [isRemDirty, setIsRemDirty] = useState(false);
  const [isSubmittingRem, setIsSubmittingRem] = useState(false);
  const remImageRef = useRef<HTMLInputElement>(null);

  const isSingleTree = intervention.type === SINGLE_TREE_TYPE;
  const isMultiTree = !isSingleTree;
  const hasPolygon =
    intervention.originalGeometry?.type === 'Polygon' ||
    intervention.originalGeometry?.type === 'MultiPolygon';

  const interventionStartDate = intervention.interventionStartDate
    ? new Date(intervention.interventionStartDate).toISOString().split('T')[0]
    : '';

  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  // Initialise form when modal opens
  useEffect(() => {
    if (isOpen && tree) {
      setActiveTab('basic');
      setIsDirty(false);

      setTag(tree.tag || '');
      setHeight(tree.height?.toString() || '');
      setWidth(tree.width?.toString() || '');
      setPlantingDate(
        tree.plantingDate
          ? new Date(tree.plantingDate).toISOString().split('T')[0]
          : '',
      );
      setPlantingDateError('');

      setLocation(tree.originalGeometry || tree.location || null);
      setLocationChanged(false);
      setSpeciesChanged(false);
      setCurrentImage(tree.image || null);
      setImageFile(null);
      setImagePreview(null);

      setRemStatus(tree.status === 'dead' ? 'dead' : 'alive');
      setRemHeight('');
      setRemWidth('');
      setRemUnit('m');
      setRemNotes('');
      setRemImageFile(null);
      setRemImagePreview(null);
      setIsRemDirty(false);
      setShowDeadNotice(false);

      // Species initialisation

      setSearchQuery('');
      setSearchResults([]);
      setShowResults(false);
      setSpeciesError('');

      if (tree.scientificSpeciesId && tree.speciesName) {
        setSelectedSpecies({
          id: tree.scientificSpeciesId,
          uid: '',
          scientificName: tree.speciesName,
          commonName: tree.commonName,
        });
      } else {
        setSelectedSpecies(null);
      }

      const currentSpeciesUid =
        tree.interventionSpeciesUid ||
        intervention.species?.find(
          (s) => s.speciesName === tree.speciesName,
        )?.uid ||
        '';
      setSelectedInterventionSpeciesUid(currentSpeciesUid);
    }
  }, [isOpen, tree]);

  // Debounced species search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const resp = await getSciencetificSpecies(accessToken, searchQuery);
          if (resp.statusCode === 200) {
            setSearchResults(resp.data || []);
            setShowResults(true);
          }
        } catch {
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
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const markDirty = () => setIsDirty(true);

  const handlePlantingDateChange = (value: string) => {
    setPlantingDate(value);
    markDirty();
    if (interventionStartDate && value < interventionStartDate) {
      setPlantingDateError(
        `Planting date cannot be before intervention start date (${new Date(interventionStartDate).toLocaleDateString()})`,
      );
    } else {
      setPlantingDateError('');
    }
  };

  const handleSpeciesSelect = (sp: ScientificSpecies) => {
    setSelectedSpecies(sp);
    setSearchQuery('');
    setShowResults(false);
    setSpeciesError('');
    setSpeciesChanged(true);
    markDirty();

    // Try to find the matching intervention species entry, or default to current
    const matchingIntSpecies = intervention.species?.find(
      (s) => s.scientificSpeciesId === sp.id,
    );
    setSelectedInterventionSpeciesUid(
      matchingIntSpecies?.uid || tree.interventionSpeciesUid || intervention.species?.[0]?.uid || '',
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10 MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    markDirty();
  };

  const uploadToR2 = async (file: File): Promise<string | null> => {
    try {
      const presignResp = await generatePreSignUrl(accessToken, {
        fileName: String(Date.now()),
        fileType: file.type,
        folder: 'tree',
      });
      const presignData = presignResp?.data?.data || presignResp?.data;
      if (!presignData?.uploadUrl) throw new Error('Failed to get upload URL');

      const form = new FormData();
      form.append('file', file);

      const uploadResp = await fetch(
        `/api/upload-image?uploadUrl=${encodeURIComponent(presignData.uploadUrl)}`,
        { method: 'PUT', body: form },
      );
      if (!uploadResp.ok) throw new Error('Upload failed');

      return presignData.fileName;
    } catch (err) {
      console.error('R2 upload error:', err);
      toast.error('Failed to upload image');
      return null;
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return currentImage;
    return uploadToR2(imageFile);
  };

  const handleRemImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10 MB');
      return;
    }
    setRemImageFile(file);
    setRemImagePreview(URL.createObjectURL(file));
    setIsRemDirty(true);
  };

  const toMeters = (value: string, unit: 'm' | 'cm'): number | undefined => {
    const n = parseFloat(value);
    if (isNaN(n) || n < 0) return undefined;
    return unit === 'cm' ? n / 100 : n;
  };

  const handleSaveRemeasurement = async () => {
    if (!remStatus) {
      toast.error('Please select a status');
      return;
    }

    setIsSubmittingRem(true);
    try {
      let imageFileName: string | undefined;
      if (remImageFile) {
        const uploaded = await uploadToR2(remImageFile);
        if (!uploaded) {
          setIsSubmittingRem(false);
          return;
        }
        imageFileName = uploaded;
      }

      const payload: Parameters<typeof addTreeRemeasurement>[3] = {
        status: remStatus as 'alive' | 'dead',
        notes: remNotes || undefined,
        image: imageFileName,
      };

      if (remStatus === 'alive') {
        const h = toMeters(remHeight, remUnit);
        const w = toMeters(remWidth, remUnit);
        if (h !== undefined) payload.height = h;
        if (w !== undefined) payload.width = w;
      }

      const result = await addTreeRemeasurement(accessToken, tree.hid, selectedProject, payload);
      const isSuccess = result?.success || result?.data?.success;

      if (isSuccess) {
        toast.success('Remeasurement recorded');
        setIsRemDirty(false);
        const responseData = result?.data?.data || result?.data;
        onSaveComplete(responseData?.tree || responseData || result);
        onClose();
      } else {
        throw new Error(result?.message || 'Failed to record remeasurement');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to record remeasurement');
    } finally {
      setIsSubmittingRem(false);
    }
  };

  const validate = (): boolean => {
    if (plantingDateError) return false;

    // Image: must always have at least one
    if (!currentImage && !imageFile) {
      toast.error('At least one image is required');
      setActiveTab('image');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!isDirty) {
      onClose();
      return;
    }

    if (!validate()) return;

    setIsSaving(true);
    try {
      let imageFileName = currentImage;
      if (imageFile) {
        imageFileName = await uploadImage();
        if (imageFileName === null) {
          setIsSaving(false);
          return;
        }
      }

      const payload: Record<string, any> = {};

      if (tag !== (tree.tag || '')) payload.tag = tag;
      if (height !== (tree.height?.toString() || '')) payload.height = parseFloat(height) || undefined;
      if (width !== (tree.width?.toString() || '')) payload.width = parseFloat(width) || undefined;

      const origPlanting = tree.plantingDate
        ? new Date(tree.plantingDate).toISOString().split('T')[0]
        : '';
      if (plantingDate !== origPlanting) payload.plantingDate = plantingDate || undefined;

      if (locationChanged && location) payload.location = location;

      if (imageFile || imageFileName !== tree.image) payload.image = imageFileName;

      if (speciesChanged) {
        if (isSingleTree && selectedSpecies) {
          payload.species = {
            scientificSpeciesId: selectedSpecies.id,
            speciesName: selectedSpecies.scientificName,
            commonName: selectedSpecies.commonName,
          };
        } else if (!isSingleTree && selectedInterventionSpeciesUid) {
          payload.species = {
            interventionSpeciesUid: selectedInterventionSpeciesUid,
          };
        }
      }

      const result = await editTree(accessToken, tree.hid, selectedProject, payload);
      const isSuccess = result?.success || result?.data?.success;

      if (isSuccess) {
        toast.success('Tree updated successfully');
        onSaveComplete(result?.data?.data || result?.data || result);
        onClose();
      } else {
        throw new Error(result?.message || 'Failed to update tree');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update tree');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) onClose();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Tree</h2>
              <p className="text-sm text-gray-500">
                {tree.tag || tree.hid} &mdash; {tree.hid}
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
          <div className="flex border-b border-gray-200 px-6 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'remeasurement') {
                      if (tree.status === 'dead') {
                        setShowDeadNotice(true);
                      } else {
                        setRemStatus('alive');
                        setIsRemDirty(true);
                      }
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
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

          {/* Tab Content */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6">

            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-5">
                {/* Tag */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => { setTag(e.target.value); markDirty(); }}
                    placeholder="Tree tag / label"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent"
                  />
                </div>

                {/* Height & Width */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height (m)</label>
                    <input
                      type="number"
                      value={height}
                      min="0"
                      step="0.01"
                      onChange={(e) => { setHeight(e.target.value); markDirty(); }}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Width/DBH (cm)</label>
                    <input
                      type="number"
                      value={width}
                      min="0"
                      step="0.01"
                      onChange={(e) => { setWidth(e.target.value); markDirty(); }}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Planting Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planting Date</label>
                  <input
                    type="date"
                    value={plantingDate}
                    min={interventionStartDate || undefined}
                    max={today}
                    onChange={(e) => handlePlantingDateChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent ${
                      plantingDateError ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                  {plantingDateError && (
                    <p className="mt-1 text-xs text-red-600">{plantingDateError}</p>
                  )}
                  {interventionStartDate && (
                    <p className="mt-1 text-xs text-gray-500">
                      Must be on or after intervention start: {new Date(interventionStartDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Species Tab */}
            {activeTab === 'species' && (
              <div className="space-y-5">
                {/* Current species summary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Current Species</h3>
                  <p className="text-sm text-gray-900">{tree.speciesName || 'Unknown species'}</p>
                  {tree.commonName && (
                    <p className="text-xs text-gray-500 mt-0.5">{tree.commonName}</p>
                  )}
                </div>

                {isSingleTree ? (
                  /* ── Single-tree: free DB search ── */
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select New Species
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by scientific name, common name…"
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent"
                        />
                        {isSearching && (
                          <Loader2 className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 animate-spin" />
                        )}
                        {showResults && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                            {searchResults.length > 0 ? (
                              searchResults.map((sp) => (
                                <button
                                  key={sp.id}
                                  onClick={() => handleSpeciesSelect(sp)}
                                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                                >
                                  <div className="font-medium text-sm text-gray-900">{sp.scientificName}</div>
                                  {sp.commonName && (
                                    <div className="text-xs text-gray-500">{sp.commonName}</div>
                                  )}
                                  {sp.family && (
                                    <div className="text-xs text-gray-400">Family: {sp.family}</div>
                                  )}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-6 text-center text-gray-400 text-sm">
                                No species found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {searchQuery.length > 0 && searchQuery.length < 2 && (
                        <p className="mt-1 text-xs text-gray-400">Type at least 2 characters to search</p>
                      )}
                    </div>

                    {selectedSpecies && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-900">Selected</p>
                            <p className="text-sm text-green-800">{selectedSpecies.scientificName}</p>
                            {selectedSpecies.commonName && (
                              <p className="text-xs text-green-700">{selectedSpecies.commonName}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2">
                      <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700">
                        For single-tree registrations the count is always 1. Changing the species updates both the tree record and the intervention&apos;s species entry.
                      </p>
                    </div>
                  </>
                ) : (
                  /* ── Multi-tree: pick from existing intervention species ── */
                  <>
                    {intervention.species && intervention.species.length > 0 ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assign to Species
                        </label>
                        <select
                          value={selectedInterventionSpeciesUid}
                          onChange={(e) => {
                            setSelectedInterventionSpeciesUid(e.target.value);
                            setSpeciesChanged(true);
                            markDirty();
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent"
                        >
                          <option value="">-- Select species --</option>
                          {intervention.species.map((sp) => (
                            <option key={sp.uid} value={sp.uid}>
                              {sp.isUnknown ? 'Unknown species' : (sp.speciesName || 'Unknown')}
                              {sp.commonName ? ` (${sp.commonName})` : ''}
                              {' '}— {sp.count} tree{sp.count !== 1 ? 's' : ''}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          Counts update automatically: the old species decreases by 1, the new one increases by 1.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">
                          This intervention has no species entries yet. Add a species to the intervention first before reassigning this tree.
                        </p>
                      </div>
                    )}

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2">
                      <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700">
                        You can only assign this tree to a species already registered under this intervention. To use a different species, add it to the intervention first.
                      </p>
                    </div>
                  </>
                )}

                {speciesError && (
                  <p className="text-sm text-red-600">{speciesError}</p>
                )}
              </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <div className="space-y-4">
                {isMultiTree && hasPolygon && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      For multi-tree registrations, the point must remain within the intervention polygon boundary.
                    </p>
                  </div>
                )}

                <div style={{ width: '100%', height: '50vh' }} className="rounded-lg overflow-hidden border border-gray-200">
                  <UnifiedMapComponent
                    updateGeoJSON={(geoJSON) => {
                      setLocation(geoJSON);
                      setLocationChanged(true);
                      markDirty();
                    }}
                    uploadedGeoJSON={location || tree.location || tree.originalGeometry}
                    mode="point"
                  />
                </div>

                <p className="text-xs text-gray-500">
                  Click on the map or drag the marker to update the tree's GPS location.
                </p>
              </div>
            )}

            {/* Remeasurement Tab */}
            {activeTab === 'remeasurement' && (
              <div className="space-y-6">

                {/* Dead notice modal */}
                {showDeadNotice && (
                  <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeadNotice(false)} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                          <HeartOff size={20} className="text-red-600" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">Tree is dead</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        This tree has already been marked as dead. Its status cannot be changed back. You can still add notes or a photo to record further observations.
                      </p>
                      <button
                        onClick={() => setShowDeadNotice(false)}
                        className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
                      >
                        Got it
                      </button>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tree Status <span className="text-red-500">*</span>
                  </label>
                  {tree.status === 'dead' ? (
                    <div className="flex items-center gap-2 px-5 py-3 rounded-lg border-2 border-red-300 bg-red-50 text-red-600 w-fit">
                      <HeartOff size={16} />
                      <span className="text-sm font-medium">Dead</span>
                      <span className="ml-2 text-xs text-red-400">(cannot be changed)</span>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => { setRemStatus('alive'); setIsRemDirty(true); }}
                        className={`flex items-center gap-2 px-5 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                          remStatus === 'alive'
                            ? 'border-[#007A49] bg-[#007A49]/10 text-[#007A49]'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Heart size={16} />
                        Alive
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRemStatus('dead'); setIsRemDirty(true); }}
                        className={`flex items-center gap-2 px-5 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                          remStatus === 'dead'
                            ? 'border-red-500 bg-red-50 text-red-600'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <HeartOff size={16} />
                        Dead
                      </button>
                    </div>
                  )}
                </div>

                {/* Height + Width — only when alive */}
                {remStatus === 'alive' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Measurements</span>
                      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                        <button
                          type="button"
                          onClick={() => setRemUnit('m')}
                          className={`px-3 py-1.5 transition-colors ${
                            remUnit === 'm' ? 'bg-[#007A49] text-white' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          m
                        </button>
                        <button
                          type="button"
                          onClick={() => setRemUnit('cm')}
                          className={`px-3 py-1.5 transition-colors ${
                            remUnit === 'cm' ? 'bg-[#007A49] text-white' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          cm
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Height ({remUnit})
                        </label>
                        <input
                          type="number"
                          value={remHeight}
                          min="0"
                          step={remUnit === 'cm' ? '1' : '0.01'}
                          onChange={(e) => { setRemHeight(e.target.value); setIsRemDirty(true); }}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Width ({remUnit})
                        </label>
                        <input
                          type="number"
                          value={remWidth}
                          min="0"
                          step={remUnit === 'cm' ? '1' : '0.01'}
                          onChange={(e) => { setRemWidth(e.target.value); setIsRemDirty(true); }}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                    {remStatus === 'dead' && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {remStatus === 'dead' && (
                    <p className="text-xs text-red-600 mb-2">Required when marking a tree as dead -- describe the cause.</p>
                  )}
                  <textarea
                    value={remNotes}
                    onChange={(e) => { setRemNotes(e.target.value); setIsRemDirty(true); }}
                    rows={3}
                    maxLength={1000}
                    placeholder={remStatus === 'dead' ? 'Describe the cause of death...' : 'Add any observations or notes...'}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent resize-none ${
                      remStatus === 'dead' && !remNotes.trim() ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                  <p className="text-xs text-gray-400 mt-1">{remNotes.length}/1000</p>
                </div>

                {/* Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                  <input
                    ref={remImageRef}
                    type="file"
                    accept="image/*"
                    onChange={handleRemImageSelect}
                    className="hidden"
                  />
                  {remImagePreview ? (
                    <div className="space-y-3">
                      <div className="relative w-full max-w-md">
                        <img
                          src={remImagePreview}
                          alt="Remeasurement"
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => { setRemImageFile(null); setRemImagePreview(null); }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => remImageRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
                      >
                        <Upload size={15} />
                        Replace Photo
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => remImageRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 w-full max-w-md h-36 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Upload size={22} />
                      <span className="text-sm font-medium">Upload Photo</span>
                      <span className="text-xs">JPG, PNG, WebP — max 10 MB</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Image Tab */}
            {activeTab === 'image' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tree Image</label>
                  <p className="text-xs text-gray-500 mb-4">
                    At least one image is required. Replacing an image will update the image record.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {imagePreview || currentImage ? (
                    <div className="space-y-3">
                      <div className="relative w-full max-w-md">
                        <img
                          src={
                            imagePreview ||
                            (cdnUrl('tree', currentImage) ?? '')
                          }
                          alt="Tree"
                          className="w-full h-52 object-cover rounded-lg border border-gray-200"
                        />
                        {/* Only allow removing if there's a new file queued — keep existing to satisfy min-1 rule */}
                        {imagePreview && (
                          <button
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            title="Discard new image"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
                      >
                        <Upload size={15} />
                        Replace Image
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 w-full max-w-md h-44 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Upload size={24} />
                      <span className="text-sm font-medium">Upload Tree Image</span>
                      <span className="text-xs">Click to browse</span>
                    </button>
                  )}

                  <p className="text-xs text-gray-400 mt-3">
                    Supported: JPG, PNG, WebP &mdash; Max 10 MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <span className="text-sm">
              {activeTab === 'remeasurement' ? (
                isRemDirty
                  ? <span className="text-amber-600">• Unsaved remeasurement</span>
                  : <span className="text-gray-500">No changes</span>
              ) : isDirty ? (
                <span className="text-amber-600">• Unsaved changes</span>
              ) : (
                <span className="text-gray-500">No changes</span>
              )}
            </span>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isSaving || isSubmittingRem}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              {activeTab === 'remeasurement' ? (
                <button
                  onClick={handleSaveRemeasurement}
                  disabled={!isRemDirty || isSubmittingRem || !remStatus || (remStatus === 'dead' && !remNotes.trim())}
                  className="flex items-center gap-2 px-4 py-2 bg-[#007A49] text-white rounded-lg hover:bg-[#006B3F] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingRem ? (
                    <>
                      <Loader className="animate-spin h-4 w-4" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Activity size={16} />
                      Save Remeasurement
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={!isDirty || isSaving || !!plantingDateError}
                  className="flex items-center gap-2 px-4 py-2 bg-[#007A49] text-white rounded-lg hover:bg-[#006B3F] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader className="animate-spin h-4 w-4" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
