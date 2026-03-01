'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Info,
  MapPin,
  Camera,
  Layers,
  Loader,
  AlertTriangle,
  Check,
  Upload,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  editInterventionComprehensive,
  preValidateInterventionEdit,
  generatePreSignUrl,
} from '@shared-core/fetchApi/api.fetch';
import UnifiedMapComponent from '@/component/MapSelect';

const TABS = [
  { id: 'basic', label: 'Basic Info', icon: Info },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'image', label: 'Image', icon: Camera },
  { id: 'site', label: 'Site', icon: Layers },
];

const SINGLE_TREE_TYPE = 'single-tree-registration';

interface EditInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  intervention: any;
  accessToken: string;
  selectedProject: string;
  sites: any[];
  onSaveComplete: (updatedIntervention: any) => void;
}

interface ValidationError {
  code: string;
  message: string;
  details?: any;
}

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
  const [dateErrors, setDateErrors] = useState<{ start?: string; end?: string }>({});

  const [formData, setFormData] = useState({
    interventionStartDate: '',
    interventionEndDate: '',
    description: '',
    geometry: null as any,
    image: null as string | null,
    siteUid: null as string | null,
  });

  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSingleTree = intervention?.type === SINGLE_TREE_TYPE;
  // Use local date (not UTC) so users in UTC+ timezones can select today without a false error
  const today = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

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
        image: intervention.image || null,
        siteUid: intervention.site?.uid || null,
      });
      setChangedFields(new Set());
      setValidationErrors([]);
      setDateErrors({});
      setIsDirty(false);
      setActiveTab('basic');
      setImageFile(null);
      setImagePreview(null);
    }
  }, [isOpen, intervention]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setChangedFields((prev) => new Set(prev).add(field));
    setIsDirty(true);
  };

  // Validate date rules: start not in future, end not before start
  const checkDates = (startDate: string, endDate: string): { start?: string; end?: string } => {
    const errors: { start?: string; end?: string } = {};
    if (startDate && startDate > today) {
      errors.start = 'Start date cannot be in the future';
    }
    if (endDate && startDate && endDate < startDate) {
      errors.end = 'End date cannot be before start date';
    }
    return errors;
  };

  const handleStartDateChange = (value: string) => {
    handleFieldChange('interventionStartDate', value);
    setDateErrors(checkDates(value, formData.interventionEndDate));
  };

  const handleEndDateChange = (value: string) => {
    handleFieldChange('interventionEndDate', value);
    setDateErrors(checkDates(formData.interventionStartDate, value));
  };

  const handleGeometryChange = (geoJSON: any) => {
    handleFieldChange('geometry', geoJSON);
  };

  // Image upload
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setIsDirty(true);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image;

    try {
      const presignResponse = await generatePreSignUrl(accessToken, {
        fileName: String(new Date().getMilliseconds()),
        fileType: imageFile.type,
        folder: 'intervention',
      });

      // Response is nested: { data: { data: { uploadUrl, fileName } } }
      const presignData = presignResponse?.data?.data || presignResponse?.data;
      if (!presignData?.uploadUrl) throw new Error('Failed to get upload URL');

      const uploadFormData = new FormData();
      uploadFormData.append('file', imageFile);

      const uploadResponse = await fetch(
        `/api/upload-image?uploadUrl=${encodeURIComponent(presignData.uploadUrl)}`,
        { method: 'PUT', body: uploadFormData }
      );

      if (!uploadResponse.ok) throw new Error('Failed to upload image');

      return presignData.fileName;
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  // Pre-validate with server before saving
  const validateEdit = async (): Promise<boolean> => {
    // Client-side date check first
    const dErrors = checkDates(formData.interventionStartDate, formData.interventionEndDate);
    if (Object.keys(dErrors).length > 0) {
      setDateErrors(dErrors);
      return false;
    }

    setIsValidating(true);
    setValidationErrors([]);

    try {
      const editData: any = {};
      if (changedFields.has('interventionStartDate')) editData.interventionStartDate = formData.interventionStartDate;
      if (changedFields.has('interventionEndDate')) editData.interventionEndDate = formData.interventionEndDate;
      if (changedFields.has('description')) editData.description = formData.description;
      if (changedFields.has('siteUid')) editData.siteUid = formData.siteUid;
      if (changedFields.has('geometry')) editData.geometry = formData.geometry;

      // Skip server pre-validate if only image changed (image isn't validated server-side pre-save)
      if (Object.keys(editData).length === 0) return true;

      const result = await preValidateInterventionEdit(
        accessToken, intervention.uid, selectedProject, editData
      );

      const validationData = result?.data?.data || result?.data;
      if (validationData && !validationData.valid) {
        setValidationErrors(validationData.errors || []);
        return false;
      }

      return true;
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
      } else {
        setValidationErrors([{ code: 'UNKNOWN', message: error.message || 'Validation failed' }]);
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

    const isValid = await validateEdit();
    if (!isValid) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    setIsSaving(true);

    try {
      let imageFileName = formData.image;
      if (imageFile) {
        imageFileName = await uploadImage();
        if (!imageFileName) {
          setIsSaving(false);
          return;
        }
      }

      const editData: any = {};
      if (changedFields.has('interventionStartDate')) editData.interventionStartDate = formData.interventionStartDate;
      if (changedFields.has('interventionEndDate')) editData.interventionEndDate = formData.interventionEndDate;
      if (changedFields.has('description')) editData.description = formData.description;
      if (changedFields.has('siteUid')) editData.siteUid = formData.siteUid;
      if (changedFields.has('geometry')) editData.geometry = formData.geometry;
      if (imageFile || changedFields.has('image')) editData.image = imageFileName;

      const result = await editInterventionComprehensive(
        accessToken, intervention.uid, selectedProject, editData
      );

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
      if (error.response?.data?.errors) setValidationErrors(error.response.data.errors);
      else if (error.errors) setValidationErrors(error.errors);
      toast.error(error.message || 'Failed to update intervention');
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

  const hasSavingDateErrors = Object.keys(dateErrors).length > 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
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
                {intervention.type?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} &mdash; {intervention.hid}
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

          {/* Server Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-900">Validation Errors</h4>
                  <ul className="mt-2 space-y-1">
                    {validationErrors.map((error, idx) => (
                      <li key={idx} className="text-sm text-red-700">
                        {error.message}
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
                <div className={`grid gap-4 ${isSingleTree ? 'grid-cols-1 max-w-xs' : 'grid-cols-2'}`}>
                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.interventionStartDate}
                      max={today}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent ${
                        dateErrors.start ? 'border-red-400 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                    {dateErrors.start && (
                      <p className="mt-1 text-xs text-red-600">{dateErrors.start}</p>
                    )}
                  </div>

                  {/* End Date — hidden for single-tree interventions */}
                  {!isSingleTree && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={formData.interventionEndDate}
                        min={formData.interventionStartDate || undefined}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent ${
                          dateErrors.end ? 'border-red-400 bg-red-50' : 'border-gray-200'
                        }`}
                      />
                      {dateErrors.end && (
                        <p className="mt-1 text-xs text-red-600">{dateErrors.end}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Description */}
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
                {(intervention.treeCount ?? 0) > 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-900">Location cannot be edited</p>
                        <p className="mt-1 text-sm text-amber-700">
                          This intervention has <strong>{intervention.treeCount}</strong> registered{' '}
                          {intervention.treeCount === 1 ? 'tree' : 'trees'}. Delete all trees first before
                          changing the intervention boundary.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        Draw or modify the intervention boundary on the map.
                      </p>
                    </div>
                    <div style={{ width: '100%', height: '50vh' }} className="rounded-lg overflow-hidden border border-gray-200">
                      <UnifiedMapComponent
                        updateGeoJSON={handleGeometryChange}
                        uploadedGeoJSON={formData.geometry}
                        mode={formData.geometry?.type === 'Polygon' || formData.geometry?.type === 'MultiPolygon' ? 'polygon' : 'point'}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Image Tab */}
            {activeTab === 'image' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intervention Image
                  </label>
                  <p className="text-xs text-gray-500 mb-4">
                    Primary image for this intervention record. Not to be confused with individual tree photos.
                  </p>

                  {/* Hidden file input — shared between upload & replace */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {imagePreview || formData.image ? (
                    <div className="space-y-3">
                      <div className="relative w-full max-w-md">
                        <img
                          src={
                            imagePreview ||
                            `${process.env.NEXT_PUBLIC_CDN}/intervention/${formData.image}`
                          }
                          alt="Intervention"
                          className="w-full h-52 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                            handleFieldChange('image', null);
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          title="Remove image"
                        >
                          <X size={14} />
                        </button>
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
                      <span className="text-sm font-medium">Upload Intervention Image</span>
                      <span className="text-xs">Click to browse</span>
                    </button>
                  )}

                  <p className="text-xs text-gray-400 mt-3">
                    Supported: JPG, PNG, WebP &mdash; Max 10 MB
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
                  {intervention.site?.uid && !formData.siteUid && (
                    <p className="mt-1 text-xs text-amber-600">
                      Saving will unassign this intervention from its current site.
                    </p>
                  )}
                </div>

                {formData.siteUid && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Site</h4>
                    {(() => {
                      const selectedSite = sites.find((s) => s.uid === formData.siteUid);
                      return selectedSite ? (
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Name:</strong> {selectedSite.name}</p>
                          {selectedSite.description && (
                            <p><strong>Description:</strong> {selectedSite.description}</p>
                          )}
                          {selectedSite.status && (
                            <p><strong>Status:</strong> {selectedSite.status}</p>
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
            <div className="text-sm">
              {isDirty ? (
                <span className="text-amber-600">• Unsaved changes</span>
              ) : (
                <span className="text-gray-500">No changes</span>
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
                disabled={!isDirty || isSaving || isValidating || hasSavingDateErrors}
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
      </div>
    </AnimatePresence>
  );
}
