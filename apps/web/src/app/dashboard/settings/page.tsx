'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Settings, Users, MapPin, Shield,
  Trash2, Save, ArrowLeft, Leaf, Tractor,
  Globe, Info, FileText, ChevronDown, Upload,
  AlertTriangle, Lock, Menu, X, Plus, UserX,
  Check, Loader, ChevronRight,
  Video, Building, Timer, AlertCircle, Image, ImagePlus
} from 'lucide-react';

import UnifiedMapComponent from '@/component/MapSelect';
import GeoJSONUpload from '@/component/GeoJSONfileupload';
import { deleteProject, getSingleProjectDetails, updateProjectSettings, getProjectImages, addProjectImage, deleteProjectImage, generatePreSignUrl } from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import useProjectStore from '@shared-core/store/useProjectStore';
import { toast } from 'react-toastify';


// Enhanced Toggle Switch Component
const ToggleSwitch = ({ checked, onChange, disabled = false, size = 'default' }) => {
  const sizeClasses = size === 'small' ? 'w-10 h-5' : 'w-12 h-6';
  const dotSize = size === 'small' ? 'after:h-4 after:w-4' : 'after:h-5 after:w-5';
  const translateX = size === 'small' ? 'peer-checked:after:translate-x-5' : 'peer-checked:after:translate-x-6';

  return (
    <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <div className={`${sizeClasses} rounded-full transition-all duration-300 peer-focus:ring-4 peer-focus:ring-[#007A49]/20 ${checked ? 'bg-[#007A49]' : 'bg-stone-300'
        } ${translateX} after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full ${dotSize} after:transition-all after:shadow-sm`}></div>
    </label>
  );
};

// Enhanced Input Field Component
const InputField = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  icon: Icon = null,
  validation = {} as { error?: string; success?: boolean; hint?: string },
  required = false,
  disabled = false,
  ...props
}) => {
  const hasError = validation?.error;
  const hasSuccess = validation?.success;

  return (
    <div className="space-y-2">
      <label className={`block text-sm font-semibold ${disabled ? 'text-stone-500' : 'text-stone-700'}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className={`h-5 w-5 ${disabled ? 'text-stone-300' : 'text-stone-400'}`} />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`${Icon ? 'pl-12' : 'pl-4'} w-full px-4 py-3 border rounded-xl transition-all duration-300 relative ${
            disabled
              ? 'bg-stone-100 text-stone-500 border-stone-200 cursor-not-allowed'
              : hasError
                ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : hasSuccess
                  ? 'border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                  : 'border-stone-300 focus:border-[#007A49] focus:ring-2 focus:ring-[#007A49]/20'
            } focus:outline-none bg-white`}
          {...props}
        />
        {hasError && !disabled && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <X size={16} className="text-red-500" />
          </div>
        )}
        {hasSuccess && !disabled && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Check size={16} className="text-green-500" />
          </div>
        )}
        {disabled && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Lock size={16} className="text-stone-400" />
          </div>
        )}
      </div>
      {hasError && !disabled && (
        <p className="text-xs text-red-600 animate-in slide-in-from-top-1 duration-200">
          {validation.error}
        </p>
      )}
      {validation?.hint && !hasError && (
        <p className={`text-xs ${disabled ? 'text-stone-400' : 'text-stone-500'}`}>{validation.hint}</p>
      )}
    </div>
  );
};

// Enhanced Select Field Component
const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  icon: Icon = null,
  validation = {} as { error?: string },
  required = false,
  ...props
}) => {
  const hasError = validation?.error;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-stone-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-stone-400" />
          </div>
        )}
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={`${Icon ? 'pl-12' : 'pl-4'} w-full px-4 py-3 border rounded-xl transition-all duration-300 relative ${hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-stone-300 focus:border-[#007A49] focus:ring-2 focus:ring-[#007A49]/20'
            } focus:outline-none bg-white appearance-none`}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <ChevronDown className="h-4 w-4 text-stone-500" />
        </div>
      </div>
      {hasError && (
        <p className="text-xs text-red-600 animate-in slide-in-from-top-1 duration-200">
          {validation.error}
        </p>
      )}
    </div>
  );
};

// Enhanced Textarea Component
const TextareaField = ({
  label,
  name,
  value,
  onChange,
  rows = 4,
  placeholder = '',
  icon: Icon = null,
  validation = {} as { error?: string },
  required = false
}) => {
  const hasError = validation?.error;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-stone-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute top-4 left-4 flex items-start pointer-events-none">
            <Icon className="h-5 w-5 text-stone-400" />
          </div>
        )}
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          className={`${Icon ? 'pl-12' : 'pl-4'} w-full px-4 py-3 border rounded-xl resize-none transition-all duration-300 relative ${hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-stone-300 focus:border-[#007A49] focus:ring-2 focus:ring-[#007A49]/20'
            } focus:outline-none bg-white`}
        />
      </div>
      {hasError && (
        <p className="text-xs text-red-600 animate-in slide-in-from-top-1 duration-200">
          {validation.error}
        </p>
      )}
    </div>
  );
};

// Collapsible Section Component
const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-stone-200/50 shadow-sm transition-all duration-300 hover:shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-stone-50/50 transition-colors duration-200 rounded-t-2xl"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#007A49]/10 rounded-xl flex items-center justify-center">
            <Icon className="h-5 w-5 text-[#007A49]" />
          </div>
          <h3 className="text-lg font-semibold text-stone-800">{title}</h3>
        </div>
        <ChevronRight
          className={`h-5 w-5 text-stone-500 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
};

// Navigation Item Component
const NavItem = ({ item, isActive, onClick }) => (
  <button
    onClick={() => onClick(item.id)}
    className={`flex items-center w-full px-4 py-3 rounded-xl text-left transition-all duration-200 relative ${isActive
      ? item.danger
        ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
        : 'bg-[#007A49]/10 text-[#007A49] border border-[#007A49]/20 shadow-sm'
      : item.danger
        ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
        : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
      }`}
  >
    <item.icon size={20} className="mr-3 flex-shrink-0" />
    <span className="font-medium">{item.label}</span>
  </button>
);

// Enhanced File Upload Component
const FileUpload = ({ label, accept, onChange, fileName, icon: Icon }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-stone-700">{label}</label>
    <div className="bg-stone-50/50 rounded-xl p-6 border-2 border-dashed border-stone-300 hover:border-[#007A49]/50 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <label className="cursor-pointer bg-white py-3 px-6 border border-stone-300 rounded-xl shadow-sm text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-[#007A49] transition-all duration-200 flex items-center relative">
          {Icon ? <Icon className="h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          Choose File
          <input
            type="file"
            accept={accept}
            className="sr-only"
            onChange={onChange}
          />
        </label>
        <div className="flex-1">
          <span className="text-sm text-stone-600 font-medium">{fileName}</span>
          <p className="text-xs text-stone-400 mt-1">
            {accept ? `Accepted formats: ${accept}` : 'All file types accepted'}
          </p>
        </div>
      </div>
    </div>
  </div>
);


// Project Images Gallery Component
const ProjectImagesSection = ({ projectImages, onUpload, onDelete, uploading }) => {
  const cdnBase = process.env.NEXT_PUBLIC_CDN;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-stone-700">Project Images</label>
        <label className="cursor-pointer bg-[#007A49] text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-[#006841] transition-all duration-200 flex items-center gap-2 relative">
          {uploading ? (
            <><Loader className="h-4 w-4 animate-spin" />Uploading...</>
          ) : (
            <><ImagePlus className="h-4 w-4" />Add Image</>
          )}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            onChange={onUpload}
          />
        </label>
      </div>

      {projectImages.length === 0 ? (
        <div className="bg-stone-50/50 rounded-xl p-8 border-2 border-dashed border-stone-300 text-center">
          <Image className="h-10 w-10 text-stone-300 mx-auto mb-3" />
          <p className="text-sm text-stone-500 font-medium">No images yet</p>
          <p className="text-xs text-stone-400 mt-1">Click "Add Image" to upload project photos</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {projectImages.map((img) => (
            <div key={img.uid} className="relative group rounded-xl overflow-hidden aspect-square bg-stone-100 border border-stone-200">
              <img
                src={`${cdnBase}/project/${img.filename}`}
                alt={img.originalName || 'Project image'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => onDelete(img.uid)}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors duration-200"
                  title="Delete image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-stone-400">Supported formats: JPG, PNG, WebP. Images are stored permanently.</p>
    </div>
  );
};

// General Settings Component
const GeneralSettings = ({
  projectData,
  handleInputChange,
  handleSubmit,
  videoFileName,
  loading,
  validationErrors,
  projectImages,
  onImageUpload,
  onImageDelete,
  imageUploading,
}) => (
  <div className="space-y-8">
    <div className="flex justify-between items-start">
      <div>
        <h2 className="text-3xl font-bold text-stone-900 mb-2">Project Settings</h2>
        <p className="text-stone-600">Configure your project's basic information and settings.</p>
      </div>
    </div>

    {/* Save Button at Top */}
    <div className="flex justify-end pb-4 border-b border-stone-200">
      <button
        disabled={loading}
        type="button"
        onClick={handleSubmit}
        className="px-8 py-3 bg-[#007A49] text-white rounded-xl hover:bg-[#006841] disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 relative"
      >
        {loading ? (
          <>
            <Loader className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </>
        )}
      </button>
    </div>

    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <CollapsibleSection title="Basic Information" icon={FileText}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Project Name"
              name="name"
              value={projectData.name}
              onChange={handleInputChange}
              placeholder="Enter project name"
              icon={FileText}
              validation={{ error: validationErrors.name }}
              required
            />

            <InputField
              label="Project Slug"
              name="slug"
              value={projectData.slug}
              onChange={handleInputChange}
              placeholder="project-slug"
              icon={Globe}
              validation={{
                error: validationErrors.slug,
                hint: "URL-friendly identifier for your project"
              }}
              required
              disabled={true}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-4">
              Project Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['restoration', 'conservation', 'research', 'education'].map((type) => (
                <label key={type} className="flex items-center p-4 border border-stone-200 rounded-xl hover:bg-stone-50 cursor-pointer transition-all duration-200 hover:border-[#007A49]/50">
                  <input
                    name="type"
                    type="radio"
                    value={type}
                    checked={projectData.type === type}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-stone-300"
                  />
                  <span className="ml-3 text-stone-700 font-medium capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <TextareaField
            label="About Project"
            name="description"
            value={projectData.description}
            onChange={handleInputChange}
            placeholder="Describe your project goals, methodology, and expected outcomes..."
            icon={Info}
            rows={4}
          />
        </div>
      </CollapsibleSection>

      {/* Project Classification */}
      <CollapsibleSection title="Project Classification" icon={Settings}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            label="Purpose"
            name="purpose"
            value={projectData.purpose}
            onChange={handleInputChange}
            icon={Info}
            options={[
              { value: '', label: 'Select purpose' },
              { value: 'conservation', label: 'Conservation' },
              { value: 'restoration', label: 'Restoration' },
              { value: 'research', label: 'Research' },
              { value: 'education', label: 'Education' },
              { value: 'community', label: 'Community Development' }
            ]}
          />

          <SelectField
            label="Classification"
            name="classification"
            value={projectData.classification}
            onChange={handleInputChange}
            icon={FileText}
            options={[
              { value: '', label: 'Select classification' },
              { value: 'environmental', label: 'Environmental' },
              { value: 'social', label: 'Social' },
              { value: 'economic', label: 'Economic' },
              { value: 'research', label: 'Research' },
              { value: 'educational', label: 'Educational' }
            ]}
          />
        </div>
      </CollapsibleSection>

      {/* Environmental Details */}
      <CollapsibleSection title="Environmental Details" icon={Leaf}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SelectField
            label="Ecosystem"
            name="ecosystem"
            value={projectData.ecosystem}
            onChange={handleInputChange}
            icon={Leaf}
            options={[
              { value: '', label: 'Select ecosystem' },
              { value: 'tropical_rainforest', label: 'Tropical Rainforest' },
              { value: 'temperate_forest', label: 'Temperate Forest' },
              { value: 'boreal_forest', label: 'Boreal Forest' },
              { value: 'grassland', label: 'Grassland' },
              { value: 'wetland', label: 'Wetland' },
              { value: 'desert', label: 'Desert' },
              { value: 'coastal', label: 'Coastal' },
              { value: 'mountain', label: 'Mountain' }
            ]}
          />

          <SelectField
            label="Project Scale"
            name="scale"
            value={projectData.scale}
            onChange={handleInputChange}
            icon={MapPin}
            options={[
              { value: '', label: 'Select project scale' },
              { value: 'small', label: 'Small (< 10 hectares)' },
              { value: 'medium', label: 'Medium (10-100 hectares)' },
              { value: 'large', label: 'Large (100-1000 hectares)' },
              { value: 'enterprise', label: 'Enterprise (> 1000 hectares)' }
            ]}
          />

          <SelectField
            label="Intensity"
            name="intensity"
            value={projectData.intensity}
            onChange={handleInputChange}
            icon={Tractor}
            options={[
              { value: '', label: 'Select intensity' },
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' }
            ]}
          />
        </div>
      </CollapsibleSection>

      {/* Location & Monitoring */}
      <CollapsibleSection title="Location & Monitoring" icon={Globe}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            label="Country"
            name="country"
            value={projectData.country}
            onChange={handleInputChange}
            icon={Globe}
            options={[
              { value: '', label: 'Select country' },
              { value: 'USA', label: 'United States' },
              { value: 'CAN', label: 'Canada' },
              { value: 'MEX', label: 'Mexico' },
              { value: 'BRA', label: 'Brazil' },
              { value: 'IND', label: 'India' },
              { value: 'PAK', label: 'Pakistan' },
              { value: 'CHN', label: 'China' },
              { value: 'DEU', label: 'Germany' },
              { value: 'FRA', label: 'France' },
              { value: 'GBR', label: 'United Kingdom' },
              { value: 'AUS', label: 'Australia' }
            ]}
          />

          <SelectField
            label="Revision Periodicity"
            name="revisionPeriodicity"
            value={projectData.revisionPeriodicity}
            onChange={handleInputChange}
            icon={Timer}
            options={[
              { value: '', label: 'Select periodicity' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'quarterly', label: 'Quarterly' },
              { value: 'annually', label: 'Annually' },
              { value: 'biannually', label: 'Bi-annually' }
            ]}
          />
        </div>
      </CollapsibleSection>

      {/* Targets & Resources */}
      <CollapsibleSection title="Targets & Resources" icon={Users}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Target"
            name="target"
            type="number"
            value={projectData.target}
            onChange={handleInputChange}
            min="1"
            placeholder="Enter target number"
            icon={Users}
            validation={{
              hint: "Target must be a positive number greater than 0"
            }}
          />

          <InputField
            label="Project Website"
            name="website"
            type="url"
            value={projectData.website}
            onChange={handleInputChange}
            icon={Globe}
            placeholder="https://yourproject.com"
            validation={{
              error: validationErrors.website,
              hint: "Must start with http:// or https://"
            }}
          />
        </div>

        <ProjectImagesSection
          projectImages={projectImages}
          onUpload={onImageUpload}
          onDelete={onImageDelete}
          uploading={imageUploading}
        />

        <div className="space-y-2">
          <InputField
            label="Video URL"
            name="videoUrl"
            type="url"
            value={projectData.videoUrl}
            onChange={handleInputChange}
            icon={Video}
            placeholder="https://youtube.com/watch?v=..."
            validation={{
              hint: "YouTube, Vimeo, or direct video URL"
            }}
          />
        </div>
      </CollapsibleSection>

    </form>
  </div>
);


// Location Settings Component
const LocationSettings = ({ handleLocationUpdate, existingGeoJSON, loading }) => {
  const [geoJSON, setGeoJSON] = useState(existingGeoJSON || null);
  const [isLoading, setIsLoading] = useState(false);

  // Update geoJSON state when existingGeoJSON prop changes
  useEffect(() => {
    setGeoJSON(existingGeoJSON || null);
  }, [existingGeoJSON]);

  const handleSave = async () => {
    setIsLoading(true);
    await handleLocationUpdate(geoJSON);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-stone-900 mb-2">Project Location</h2>
          <p className="text-stone-600">Set the point location of your project using the interactive map or by uploading a point location file.</p>
        </div>
      </div>

      {/* Save Button at Top */}
      <div className="flex justify-end pb-4 border-b border-stone-200">
        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading || loading}
          className="px-8 py-3 bg-[#007A49] text-white rounded-xl hover:bg-[#006841] disabled:opacity-50 flex items-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 relative"
        >
          {(isLoading || loading) ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Update Location
            </>
          )}
        </button>
      </div>

      <CollapsibleSection title="Project Location" icon={MapPin}>
        <div className="overflow-hidden w-full h-80 lg:h-96 bg-gradient-to-br from-[#262626]/10 to-emerald-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-[#262626]/30 mb-6 relative">
          <UnifiedMapComponent mode="point" updateGeoJSON={setGeoJSON} uploadedGeoJSON={geoJSON} />
        </div>

        <div className="bg-stone-50/50 rounded-xl p-6 border border-stone-200">
          <GeoJSONUpload onGeoJSONChange={setGeoJSON} />
        </div>
      </CollapsibleSection>
    </div>
  );
};


// Features Settings Component
const FeaturesSettings = ({
  projectData,
  handleToggleChange,
  handleSubmit,
  loading
}) => (
  <div className="space-y-8">
    <div className="flex justify-between items-start">
      <div>
        <h2 className="text-3xl font-bold text-stone-900 mb-2">Features</h2>
        <p className="text-stone-600">Enable or disable optional features for your project.</p>
      </div>
    </div>

    {/* Save Button at Top */}
    <div className="flex justify-end pb-4 border-b border-stone-200">
      <button
        disabled={loading}
        type="button"
        onClick={handleSubmit}
        className="px-8 py-3 bg-[#007A49] text-white rounded-xl hover:bg-[#006841] disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 relative"
      >
        {loading ? (
          <>
            <Loader className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </>
        )}
      </button>
    </div>

    <CollapsibleSection title="Approval Workflow" icon={Shield}>
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-200">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Shield className="h-5 w-5 text-emerald-600" />
                </div>
                <h4 className="text-lg font-semibold text-stone-800">Approval Board</h4>
              </div>
              <p className="text-stone-600 text-sm leading-relaxed mb-4">
                When enabled, all interventions submitted by team members will require approval before being registered.
                Project administrators can review, approve, request changes, or reject submissions through the Approvals tab.
              </p>
              <div className="bg-white/60 rounded-lg p-4 border border-emerald-100">
                <p className="text-xs text-stone-500 font-medium mb-2">What happens when enabled:</p>
                <ul className="text-xs text-stone-600 space-y-1.5">
                  <li className="flex items-start">
                    <span className="text-emerald-500 mr-2">•</span>
                    <span>Interventions are submitted for review instead of being directly registered</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-500 mr-2">•</span>
                    <span>Admins can approve, reject, or request changes on submissions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-500 mr-2">•</span>
                    <span>Team members can track their submission status in the Approvals tab</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <ToggleSwitch
                checked={projectData.approvalBoardEnabled}
                onChange={() => handleToggleChange('approvalBoardEnabled')}
                size="default"
              />
              <span className={`text-xs font-medium mt-2 ${projectData.approvalBoardEnabled ? 'text-emerald-600' : 'text-stone-400'}`}>
                {projectData.approvalBoardEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  </div>
);


// Enhanced Danger Zone Component
const DangerZone = ({ projectData, showDeleteConfirm, setShowDeleteConfirm, handleDeleteProject }) => {
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-stone-600">Critical actions that permanently affect your project. These actions cannot be undone.</p>
      </div>

      <div className="space-y-6">
        {/* Archive Project */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/30 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="relative p-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <Lock className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-amber-800 mb-2">Archive Project</h3>
                <p className="text-amber-700 mb-6 leading-relaxed">
                  Archiving makes your project read-only. Data remains accessible for reporting, but no new entries or changes can be made. This action is reversible.
                </p>

                {!showArchiveConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowArchiveConfirm(true)}
                    className="px-6 py-3 bg-white border-2 border-amber-500 text-amber-700 rounded-xl hover:bg-amber-50 hover:border-amber-600 flex items-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105 relative"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Archive Project
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border-2 border-amber-300">
                      <p className="text-sm font-semibold text-amber-800 mb-2">
                        Archive "<span className="font-bold">{projectData.name}</span>"?
                      </p>
                      <p className="text-xs text-amber-600">
                        This will make the project read-only. You can restore it later if needed.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowArchiveConfirm(false);
                          // Handle archive logic
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 flex items-center justify-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105 relative"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Yes, Archive Project
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowArchiveConfirm(false)}
                        className="px-6 py-3 bg-white border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 flex items-center justify-center font-medium transition-all duration-200 relative"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Project */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/30 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-100/20 rounded-full translate-y-12 -translate-x-12"></div>
          <div className="relative p-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-800 mb-2">Delete Project</h3>
                <p className="text-red-700 mb-6 leading-relaxed">
                  Permanently delete this project and all associated data. This includes all trees, locations, progress reports, and collaborator assignments. This action cannot be undone.
                </p>

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-3 bg-white border-2 border-red-500 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-600 flex items-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105 relative"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Project
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border-2 border-red-300">
                      <p className="text-sm font-semibold text-red-800 mb-2">
                        Are you absolutely sure you want to delete "<span className="font-bold">{projectData.name}</span>"?
                      </p>
                      <p className="text-xs text-red-600 mb-3">
                        This action cannot be undone and will permanently delete all project data including:
                      </p>
                      <ul className="text-xs text-red-600 space-y-1 ml-4">
                        <li>• All tree inventory and location data</li>
                        <li>• Progress reports and milestones</li>
                        <li>• Collaborator assignments</li>
                        <li>• Project media and documents</li>
                      </ul>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          handleDeleteProject();
                          setShowDeleteConfirm(false);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 flex items-center justify-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105 relative"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Yes, Delete Forever
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-6 py-3 bg-white border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 flex items-center justify-center font-medium transition-all duration-200 relative"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Success/Error Notification Component
const NotificationToast = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-800' : type === 'error' ? 'bg-red-500' : 'bg-[#007A49]';
  const Icon = type === 'success' ? Check : type === 'error' ? X : Info;

  return (
    <div className={`z-40 fixed top-20 right-4 ${bgColor} text-white px-6 py-4 rounded-xl shadow-lg animate-in slide-in-from-right-full duration-300 max-w-sm`}>
      <div className="flex items-center space-x-3">
        <Icon size={20} />
        <div>
          <p className="font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto hover:bg-white/20 rounded-lg p-1 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};


// Main Project Settings Component
const ProjectSettings = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const { accessToken } = useToken();
  const selectedProject = useProjectStore(state => state.selectedProject);
  const [projectData, setProjectData] = useState({
    name: '',
    slug: '',
    type: '',
    ecosystem: '',
    scale: '',
    target: '',
    website: '',
    videoUrl: '',
    description: '',
    purpose: '',
    classification: '',
    intensity: '',
    revisionPeriodicity: '',
    country: '',
    image: null,
    location: null,
    originalGeometry: null,
    metadata: {},
    approvalBoardEnabled: false
  });

  const [activeTab, setActiveTab] = useState('general');
  const [videoFileName, setVideoFileName] = useState('No file selected');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectImages, setProjectImages] = useState<any[]>([]);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    if (selectedProject?.uid) {
      fetchProjectDetails();
      fetchImages();
    }
  }, [selectedProject]);

  const fetchProjectDetails = async () => {
    try {
      const result = await getSingleProjectDetails(accessToken, selectedProject?.uid || '');
      if (result.data) {
        setProjectData({
          name: result.data.name || '',
          slug: result.data.slug || '',
          type: result.data.type || '',
          ecosystem: result.data.ecosystem || '',
          scale: result.data.scale || '',
          // Preserve null/undefined for target - don't convert to empty string
          target: result.data.target !== null && result.data.target !== undefined ? String(result.data.target) : '',
          website: result.data.website || '',
          videoUrl: result.data.videoUrl || '',
          description: result.data.description || '',
          purpose: result.data.purpose || '',
          classification: result.data.classification || '',
          intensity: result.data.intensity || '',
          revisionPeriodicity: result.data.revisionPeriodicity || '',
          country: result.data.country || '',
          image: result.data.image ?? null,
          location: result.data.location ?? null,
          originalGeometry: result.data.originalGeometry || null,
          metadata: result.data.metadata || {},
          approvalBoardEnabled: result.data.approvalBoardEnabled ?? false
        });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to load project details' });
    }
  };

  const fetchImages = async () => {
    try {
      const result = await getProjectImages(accessToken, selectedProject?.uid || '');
      if (result.data) {
        setProjectImages(result.data);
      }
    } catch {
      // silently fail — images are non-critical
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    setImageUploading(true);
    try {
      const presignResponse = await generatePreSignUrl(accessToken, {
        fileName: file.name,
        fileType: file.type,
        folder: 'project',
      });

      const presignData = presignResponse?.data?.data || presignResponse?.data;
      if (!presignData?.uploadUrl) throw new Error('Failed to get upload URL');

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await fetch(
        `/api/upload-image?uploadUrl=${encodeURIComponent(presignData.uploadUrl)}`,
        { method: 'PUT', body: uploadFormData }
      );
      if (!uploadResponse.ok) throw new Error('Upload to storage failed');

      const saveResult = await addProjectImage(accessToken, selectedProject.uid, {
        filename: presignData.fileName,
        originalName: file.name,
        mimeType: file.type,
      });

      if (saveResult.data) {
        setProjectImages(prev => [...prev, saveResult.data]);
        toast.success('Image uploaded successfully');
      } else {
        throw new Error('Failed to save image record');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to upload image');
    } finally {
      setImageUploading(false);
      // reset file input
      e.target.value = '';
    }
  };

  const handleImageDelete = async (imageUid: string) => {
    try {
      const result = await deleteProjectImage(accessToken, selectedProject.uid, imageUid);
      if (result.statusCode === 200 || result.statusCode === 201) {
        setProjectImages(prev => prev.filter(img => img.uid !== imageUid));
        toast.success('Image deleted');
      } else {
        toast.error('Failed to delete image');
      }
    } catch {
      toast.error('Failed to delete image');
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const data = projectData as any;

    if (!data.name || !String(data.name).trim()) {
      errors.name = 'Project name is required';
    }

    if (!data.slug || !String(data.slug).trim()) {
      errors.slug = 'Project slug is required';
    } else if (!/^[a-z0-9-]+$/.test(String(data.slug))) {
      errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (!data.type) {
      errors.type = 'Project type is required';
    }

    if (data.website && !/^https?:\/\/.+/.test(String(data.website))) {
      errors.website = 'Please enter a valid URL starting with http:// or https://';
    }

    if (data.videoUrl && !/^https?:\/\/.+/.test(String(data.videoUrl))) {
      errors.videoUrl = 'Please enter a valid URL starting with http:// or https://';
    }

    const targetValue = data.target;
    if (targetValue !== '' && targetValue !== null && targetValue !== undefined) {
      const numTarget = typeof targetValue === 'string' ? Number(targetValue) : targetValue;
      if (Number.isNaN(numTarget) || numTarget <= 0) {
        errors.target = 'Target must be a positive number greater than 0';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file' && files?.length > 0) {
      // file inputs are now handled by dedicated handlers
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProjectData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setProjectData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : Number(value)) : value
      }));
    }

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleToggleChange = (fieldName: string) => {
    setProjectData(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const handleLocationUpdate = async (geoData) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProjectData(prev => ({ ...prev, originalGeometry: geoData }));
      setNotification({ type: 'success', message: 'Project location updated successfully!' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update project location' });
    } finally {
      setLoading(false);
    }
  };

  // Clean data before sending to API - convert empty strings to null/undefined for proper validation
  // Send database field names directly (name, type, scale, website) as the service expects these
  const prepareDataForApi = (data) => {
    const cleaned: Record<string, any> = {};
    
    // Required fields - always include if they have values
    if (data.name && data.name.trim()) {
      cleaned.name = data.name.trim();
    }
    
    if (data.slug && data.slug.trim()) {
      cleaned.slug = data.slug.trim();
    }
    
    if (data.type && data.type.trim()) {
      cleaned.type = data.type.trim();
    }

    // Optional string fields - only include if they have non-empty values
    if (data.description && data.description.trim()) {
      cleaned.description = data.description.trim();
    }
    
    if (data.purpose && data.purpose.trim()) {
      cleaned.purpose = data.purpose.trim();
    }
    
    if (data.classification && data.classification.trim()) {
      cleaned.classification = data.classification.trim();
    }
    
    if (data.ecosystem && data.ecosystem.trim()) {
      cleaned.ecosystem = data.ecosystem.trim();
    }
    
    if (data.scale && data.scale.trim()) {
      cleaned.scale = data.scale.trim();
    }
    
    if (data.intensity && data.intensity.trim()) {
      cleaned.intensity = data.intensity.trim();
    }
    
    if (data.revisionPeriodicity && data.revisionPeriodicity.trim()) {
      cleaned.revisionPeriodicity = data.revisionPeriodicity.trim();
    }
    
    if (data.country && data.country.trim()) {
      // Country code should be max 3 chars per schema, but DTO says 2 - use 3 for database
      const countryCode = data.country.trim().substring(0, 3).toUpperCase();
      cleaned.country = countryCode;
    }
    
    if (data.website && data.website.trim()) {
      cleaned.website = data.website.trim();
    }
    
    if (data.videoUrl && data.videoUrl.trim()) {
      cleaned.videoUrl = data.videoUrl.trim();
    }
    
    if (data.image) {
      cleaned.image = typeof data.image === 'string' ? data.image : null;
    }

    // Handle target - must be positive integer >= 1 or not sent at all
    if (data.target !== '' && data.target !== null && data.target !== undefined) {
      const targetNum = typeof data.target === 'string' ? Number(data.target) : data.target;
      if (!Number.isNaN(targetNum) && Number.isInteger(targetNum) && targetNum > 0) {
        cleaned.target = targetNum;
      }
    }

    // Handle geometry fields
    if (data.originalGeometry) {
      cleaned.originalGeometry = data.originalGeometry;
    }

    // Handle boolean fields - always include approvalBoardEnabled
    if (typeof data.approvalBoardEnabled === 'boolean') {
      cleaned.approvalBoardEnabled = data.approvalBoardEnabled;
    }

    return cleaned;
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!validateForm()) {
      setNotification({ type: 'error', message: 'Please fix the validation errors before saving' });
      return;
    }

    setLoading(true);
    try {
      const cleanedData = prepareDataForApi(projectData);
      await updateProjectSettings(accessToken, cleanedData, selectedProject.uid)
      setNotification({ type: 'success', message: 'Project settings updated successfully!' });
    } catch (error) {
      console.error('Update error:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to save project settings';
      setNotification({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    const response = await deleteProject(accessToken, selectedProject.uid);
    if (response.statusCode !== 200 && response.statusCode !== 201) {
      toast.error("Something went wrong")
      return
    }
    window.location.reload()
  };

  const navItems = [
    { id: 'general', label: 'General Settings', icon: Settings },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'features', label: 'Features', icon: Shield },
    { id: 'danger', label: 'Danger Zone', icon: Trash2, danger: true },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <GeneralSettings
            projectData={projectData}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            videoFileName={videoFileName}
            loading={loading}
            validationErrors={validationErrors}
            projectImages={projectImages}
            onImageUpload={handleImageUpload}
            onImageDelete={handleImageDelete}
            imageUploading={imageUploading}
          />
        );
      case 'location':
        return (
          <LocationSettings
            handleLocationUpdate={handleLocationUpdate}
            existingGeoJSON={projectData.originalGeometry}
            loading={loading}
          />
        );
      case 'features':
        return (
          <FeaturesSettings
            projectData={projectData}
            handleToggleChange={handleToggleChange}
            handleSubmit={handleSubmit}
            loading={loading}
          />
        );
      case 'danger':
        return (
          <DangerZone
            projectData={projectData}
            showDeleteConfirm={showDeleteConfirm}
            setShowDeleteConfirm={setShowDeleteConfirm}
            handleDeleteProject={handleDeleteProject}
          />
        );
      default:
        return (
          <GeneralSettings
            projectData={projectData}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            videoFileName={videoFileName}
            loading={loading}
            validationErrors={validationErrors}
            projectImages={projectImages}
            onImageUpload={handleImageUpload}
            onImageDelete={handleImageDelete}
            imageUploading={imageUploading}
          />
        );
    }
  };

  return (
    <div className="bg-gradient-to-br from-stone-50 to-stone-100 min-h-screen">
      {/* Notification Toast */}
      {notification && (
        <NotificationToast
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm sticky top-0  border-b border-stone-200/50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors duration-200"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="hidden lg:block">
              <h1 className="text-xl font-semibold text-stone-900">Project Settings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar Navigation */}
        <div className={`
          ${isMobileMenuOpen ? 'block' : 'hidden lg:block'}
          lg:w-80 bg-white/70 backdrop-blur-sm border-r border-stone-200/50
          fixed lg:sticky top-16 lg:top-16 w-full lg:w-auto h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]
          overflow-y-auto lg:overflow-visible
        `}>
          <div className="p-6 space-y-2">
            {navItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={activeTab === item.id}
                onClick={(id) => {
                  setActiveTab(id);
                  setIsMobileMenuOpen(false);
                }}
              />
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default ProjectSettings;