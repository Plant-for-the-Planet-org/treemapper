'use client'

import React, { useEffect, useState } from 'react';
import {
  Settings, Users, MapPin, Bell, Shield,
  Trash2, Save, ArrowLeft, Leaf, Tractor,
  Globe, Info, FileText, ChevronDown, Upload,
  AlertTriangle, Lock, Menu, X, Plus, UserX,
  Check, Loader, ChevronRight, Eye, EyeOff
} from 'lucide-react';
import UnifiedMapComponent from '@/component/MapSelect';
import GeoJSONUpload from '@/component/GeoJSONfileupload';
import { getSingleProjectDetails, updateProjectSettings } from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import useProjectStore from '@shared-core/store/useProjectStore';



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
      <div className={`${sizeClasses} rounded-full transition-all duration-300 peer-focus:ring-4 peer-focus:ring-[#007A49]/20 ${
        checked ? 'bg-[#007A49]' : 'bg-stone-300'
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
  placeholder, 
  icon: Icon,
  validation,
  required = false,
  ...props 
}) => {
  const hasError = validation?.error;
  const hasSuccess = validation?.success;
  
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
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${Icon ? 'pl-12' : 'pl-4'} w-full px-4 py-3 border rounded-xl transition-all duration-300 ${
            hasError
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : hasSuccess
              ? 'border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'
              : 'border-stone-300 focus:border-[#007A49] focus:ring-2 focus:ring-[#007A49]/20'
          } focus:outline-none bg-white`}
          {...props}
        />
        {hasError && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <X size={16} className="text-red-500" />
          </div>
        )}
        {hasSuccess && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Check size={16} className="text-green-500" />
          </div>
        )}
      </div>
      {hasError && (
        <p className="text-xs text-red-600 animate-in slide-in-from-top-1 duration-200">
          {validation.error}
        </p>
      )}
      {validation?.hint && !hasError && (
        <p className="text-xs text-stone-500">{validation.hint}</p>
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
  icon: Icon,
  validation,
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
          className={`${Icon ? 'pl-12' : 'pl-4'} w-full px-4 py-3 border rounded-xl transition-all duration-300 ${
            hasError
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
  placeholder, 
  icon: Icon,
  validation,
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
          className={`${Icon ? 'pl-12' : 'pl-4'} w-full px-4 py-3 border rounded-xl resize-none transition-all duration-300 ${
            hasError
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
    className={`flex items-center w-full px-4 py-3 rounded-xl text-left transition-all duration-200 ${
      isActive
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
        <label className="cursor-pointer bg-white py-3 px-6 border border-stone-300 rounded-xl shadow-sm text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-[#007A49] transition-all duration-200 flex items-center">
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

// General Settings Component
const GeneralSettings = ({ projectData, handleInputChange, handleSubmit, imageFileName, loading, validationErrors }) => (
  <div className="space-y-8">
    <div>
      <h2 className="text-3xl font-bold text-stone-900 mb-2">Project Settings</h2>
      <p className="text-stone-600">Configure your project's basic information and settings.</p>
    </div>

    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <CollapsibleSection title="Basic Information" icon={FileText}>
        <div className="space-y-6">
          <InputField
            label="Project Name"
            name="projectName"
            value={projectData.projectName}
            onChange={handleInputChange}
            icon={FileText}
            validation={{ error: validationErrors.projectName }}
            required
          />

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-4">
              Project Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Restoration', 'Conservation'].map((type) => (
                <label key={type} className="flex items-center p-4 border border-stone-200 rounded-xl hover:bg-stone-50 cursor-pointer transition-all duration-200 hover:border-[#007A49]/50">
                  <input
                    name="projectType"
                    type="radio"
                    value={type}
                    checked={projectData.projectType === type}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-stone-300"
                  />
                  <span className="ml-3 text-stone-700 font-medium">{type}</span>
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
              { value: 'Conservation', label: 'Conservation' },
              { value: 'Restoration', label: 'Restoration' },
              { value: 'Research', label: 'Research' },
              { value: 'Education', label: 'Education' }
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
              { value: 'Environmental', label: 'Environmental' },
              { value: 'Social', label: 'Social' },
              { value: 'Economic', label: 'Economic' },
              { value: 'Research', label: 'Research' }
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
              { value: 'moist-forest', label: 'Moist Forest' },
              { value: 'dry-land', label: 'Dry Land' },
              { value: 'tropical', label: 'Tropical' }
            ]}
          />

          <SelectField
            label="Project Scale"
            name="projectScale"
            value={projectData.projectScale}
            onChange={handleInputChange}
            icon={MapPin}
            options={[
              { value: '', label: 'Select project scale' },
              { value: 'large-scale', label: 'Large Scale' },
              { value: 'agriculture', label: 'Agriculture' }
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
              { value: 'Low', label: 'Low' },
              { value: 'Medium', label: 'Medium' },
              { value: 'High', label: 'High' }
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
              { value: 'US', label: 'United States' },
              { value: 'CA', label: 'Canada' },
              { value: 'MX', label: 'Mexico' },
              { value: 'BR', label: 'Brazil' },
              { value: 'IN', label: 'India' },
              { value: 'PK', label: 'Pakistan' },
              { value: 'CN', label: 'China' },
              { value: 'DE', label: 'Germany' },
              { value: 'FR', label: 'France' },
              { value: 'GB', label: 'United Kingdom' },
              { value: 'AU', label: 'Australia' }
            ]}
          />

          <SelectField
            label="Revision Periodicity"
            name="revisionPeriodicityLevel"
            value={projectData.revisionPeriodicityLevel}
            onChange={handleInputChange}
            icon={Bell}
            options={[
              { value: '', label: 'Select periodicity' },
              { value: 'Weekly', label: 'Weekly' },
              { value: 'Monthly', label: 'Monthly' },
              { value: 'Quarterly', label: 'Quarterly' },
              { value: 'Annually', label: 'Annually' }
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
            min="0"
            placeholder="Enter target number"
          />

          <InputField
            label="Project Website"
            name="projectWebsite"
            type="url"
            value={projectData.projectWebsite}
            onChange={handleInputChange}
            icon={Globe}
            placeholder="https://yourproject.com"
          />
        </div>

        <FileUpload
          label="Project Image"
          accept="image/*"
          onChange={handleInputChange}
          fileName={imageFileName}
          icon={Upload}
        />
      </CollapsibleSection>

      {/* Project Settings */}
      <CollapsibleSection title="Project Visibility" icon={Eye}>
        <div className="space-y-4">
          {[
            {
              key: 'isPublic',
              title: 'Public Project',
              desc: 'Make this project visible to the public',
              icon: Globe
            },
            {
              key: 'isPersonal',
              title: 'Personal Project',
              desc: 'Mark this as a personal project',
              icon: Users
            },
            {
              key: 'isPrimary',
              title: 'Primary Project',
              desc: 'Set this as your primary project',
              icon: FileText
            }
          ].map(({ key, title, desc, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-stone-50/50 hover:bg-stone-100/50 transition-colors duration-200">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-[#007A49]/10 rounded-lg flex items-center justify-center">
                  <Icon className="h-5 w-5 text-[#007A49]" />
                </div>
                <div>
                  <p className="font-semibold text-stone-800">{title}</p>
                  <p className="text-sm text-stone-600">{desc}</p>
                </div>
              </div>
              <ToggleSwitch
                checked={projectData[key]}
                onChange={() => handleInputChange({
                  target: { name: key, type: 'checkbox', checked: !projectData[key] }
                })}
              />
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Save Button */}
      <div className="flex justify-end pt-6">
        <button
          disabled={loading}
          type="submit"
          className="px-8 py-3 bg-[#007A49] text-white rounded-xl hover:bg-[#006841] disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
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
    </form>
  </div>
);

// Location Settings Component
const LocationSettings = ({ handleLocationUpdate, existingGeoJSON }) => {
  const [geoJSON, setGeoJSON] = useState(existingGeoJSON || null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-stone-900 mb-2">Project Location</h2>
        <p className="text-stone-600">Define the geographical boundaries of your project using our interactive map or by uploading location data.</p>
      </div>

      <CollapsibleSection title="Project Location" icon={MapPin}>
        <div className="overflow-hidden w-full h-80 lg:h-96 bg-gradient-to-br from-[#262626]/10 to-emerald-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-[#262626]/30 mb-6">
           <UnifiedMapComponent mode='point' updateGeoJSON={setGeoJSON} uploadedGeoJSON={geoJSON} />
        </div>

        <div className="bg-stone-50/50 rounded-xl p-6 border border-stone-200">
         <GeoJSONUpload onGeoJSONChange={setGeoJSON} />

        </div>
      </CollapsibleSection>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setIsLoading(true);
            handleLocationUpdate(geoJSON);
            setTimeout(() => setIsLoading(false), 2000);
          }}
          disabled={isLoading}
          className="px-8 py-3 bg-[#007A49] text-white rounded-xl hover:bg-[#006841] disabled:opacity-50 flex items-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
        >
          {isLoading ? (
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
    </div>
  );
};

// Notification Settings Component
const NotificationSettings = ({ projectData, handleInputChange }) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-stone-900 mb-2">Notification Settings</h2>
        <p className="text-stone-600">Configure which notifications you receive for this project to stay informed about important updates.</p>
      </div>

      <CollapsibleSection title="Notification Preferences" icon={Bell}>
        <div className="space-y-4">
          {[
            {
              key: 'progressUpdates',
              title: 'Progress Updates',
              desc: 'Receive notifications about project milestones and progress reports',
              icon: FileText
            },
            {
              key: 'treeAdditions',
              title: 'Tree Additions',
              desc: 'Get notified when new trees are added to the project inventory',
              icon: Leaf
            },
            {
              key: 'newCollaborators',
              title: 'New Collaborators',
              desc: 'Get notified when team members are added or removed from the project',
              icon: Users
            }
          ].map(({ key, title, desc, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-stone-50/50 hover:bg-stone-100/50 transition-colors duration-200">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-[#007A49]/10 rounded-lg flex items-center justify-center">
                  <Icon className="h-5 w-5 text-[#007A49]" />
                </div>
                <div>
                  <p className="font-semibold text-stone-800">{title}</p>
                  <p className="text-sm text-stone-600">{desc}</p>
                </div>
              </div>
              <ToggleSwitch
                checked={projectData.notifications[key]}
                onChange={() => handleInputChange({
                  target: { name: `notifications.${key}`, type: 'checkbox', checked: !projectData.notifications[key] }
                })}
              />
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
              // Show success notification
            }, 1000);
          }}
          disabled={isLoading}
          className="px-8 py-3 bg-[#007A49] text-white rounded-xl hover:bg-[#006841] disabled:opacity-50 flex items-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
        >
          {isLoading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
};

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
                    className="px-6 py-3 bg-white border-2 border-amber-500 text-amber-700 rounded-xl hover:bg-amber-50 hover:border-amber-600 flex items-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Archive Project
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border-2 border-amber-300">
                      <p className="text-sm font-semibold text-amber-800 mb-2">
                        Archive "<span className="font-bold">{projectData.projectName}</span>"?
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
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 flex items-center justify-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Yes, Archive Project
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowArchiveConfirm(false)}
                        className="px-6 py-3 bg-white border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 flex items-center justify-center font-medium transition-all duration-200"
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
                    className="px-6 py-3 bg-white border-2 border-red-500 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-600 flex items-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Project
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border-2 border-red-300">
                      <p className="text-sm font-semibold text-red-800 mb-2">
                        Are you absolutely sure you want to delete "<span className="font-bold">{projectData.projectName}</span>"?
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
                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 flex items-center justify-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Yes, Delete Forever
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-6 py-3 bg-white border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 flex items-center justify-center font-medium transition-all duration-200"
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

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-[#007A49]';
  const Icon = type === 'success' ? Check : type === 'error' ? X : Info;

  return (
    <div className={`fixed top-20 right-4 ${bgColor} text-white px-6 py-4 rounded-xl shadow-lg animate-in slide-in-from-right-full duration-300 max-w-sm`}>
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

  const [projectData, setProjectData] = useState({
    projectName: '',
    projectType: '',
    ecosystem: '',
    projectScale: '',
    target: '',
    projectWebsite: '',
    description: '',
    purpose: '',
    classification: '',
    intensity: '',
    revisionPeriodicityLevel: '',
    country: '',
    image: null,
    location: null,
    isPublic: true,
    isPersonal: false,
    isPrimary: false,
    geoMetry: null,
    notifications: {
      progressUpdates: false,
      treeAdditions: false,
      newCollaborators: false
    }
  });

  const { accessToken } = useToken();
  const selectedProject = useProjectStore(state => state.selectedProject);

  const [activeTab, setActiveTab] = useState('general');
  const [imageFileName, setImageFileName] = useState('No file selected');
  const [locationFileName, setLocationFileName] = useState('No file selected');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
  }, []);

  const fetchProjectDetails = async () => {
    try {
      const result = await getSingleProjectDetails(accessToken, selectedProject?.uid || '');
      if (result) {
        const response = result.data || {};
        setProjectData({
          projectName: response.projectName || '',
          projectType: response.projectType || '',
          ecosystem: response.ecosystem || '',
          projectScale: response.projectScale || '',
          target: response.target || '',
          projectWebsite: response.projectWebsite || '',
          description: response.description || '',
          purpose: response.purpose || '',
          classification: response.classification || '',
          intensity: response.intensity || '',
          revisionPeriodicityLevel: response.revisionPeriodicityLevel || '',
          country: response.country || '',
          image: null,
          geoMetry: response.originalGeometry,
          location: null,
          isPublic: response.isPublic !== undefined ? response.isPublic : true,
          isPersonal: response.isPersonal !== undefined ? response.isPersonal : false,
          isPrimary: response.isPrimary !== undefined ? response.isPrimary : false,
          notifications: {
            progressUpdates: response.notifications?.progressUpdates || false,
            treeAdditions: response.notifications?.treeAdditions || false,
            newCollaborators: response.notifications?.newCollaborators || false
          }
        });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to load project details' });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!projectData.projectName.trim()) {
      errors.projectName = 'Project name is required';
    }
    
    if (!projectData.projectType) {
      errors.projectType = 'Project type is required';
    }
    
    if (projectData.projectWebsite && !/^https?:\/\/.+/.test(projectData.projectWebsite)) {
      errors.projectWebsite = 'Please enter a valid URL starting with http:// or https://';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file' && files?.length > 0) {
      if (name === 'image') {
        setProjectData(prev => ({ ...prev, image: files[0] }));
        setImageFileName(files[0].name);
      } else if (name === 'location') {
        setProjectData(prev => ({ ...prev, location: files[0] }));
        setLocationFileName(files[0].name);
      }
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

  const handleLocationUpdate = async (geoData) => {
    setLoading(true);
    try {
      const response = await updateProjectSettings(accessToken, {
        location: geoData
      }, selectedProject?.uid);
      
      if (response && response.statusCode === 200) {
        setNotification({ type: 'success', message: 'Project location updated successfully!' });
      } else {
        throw new Error('Failed to update location');
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update project location' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setNotification({ type: 'error', message: 'Please fix the validation errors before saving' });
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        projectName: projectData.projectName,
        projectType: projectData.projectType,
        ecosystem: projectData.ecosystem,
        projectScale: projectData.projectScale,
        target: projectData.target || '1',
        projectWebsite: projectData.projectWebsite,
        description: projectData.description,
        purpose: projectData.purpose,
        classification: projectData.classification,
        intensity: projectData.intensity,
        revisionPeriodicityLevel: projectData.revisionPeriodicityLevel,
        country: projectData.country,
        isPublic: projectData.isPublic,
        isPersonal: projectData.isPersonal,
        isPrimary: projectData.isPrimary,
      };

      const response = await updateProjectSettings(accessToken, payload, selectedProject?.uid);
      if (response && response.statusCode === 200) {
        setNotification({ type: 'success', message: 'Project settings updated successfully!' });
      } else {
        throw new Error('Failed to save project settings');
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to save project settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = () => {
    setNotification({ type: 'success', message: `Project "${projectData.projectName}" has been deleted.` });
    // Implement actual delete logic here
  };

  const navItems = [
    { id: 'general', label: 'General Settings', icon: Settings },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'notifications', label: 'Notifications', icon: Bell },
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
            imageFileName={imageFileName}
            loading={loading}
            validationErrors={validationErrors}
          />
        );
      case 'location':
        return (
          <LocationSettings
            handleLocationUpdate={handleLocationUpdate}
            existingGeoJSON={projectData.geoMetry}
          />
        );
      case 'notifications':
        return (
          <NotificationSettings
            projectData={projectData}
            handleInputChange={handleInputChange}
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
            imageFileName={imageFileName}
            loading={loading}
            validationErrors={validationErrors}
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
      <div className="bg-white/80 backdrop-blur-sm sticky top-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors duration-200"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar Navigation */}
        <div className={`
          ${isMobileMenuOpen ? 'block' : 'hidden lg:block'}
          lg:w-80 bg-white/70 backdrop-blur-sm border-r border-stone-200/50
          fixed lg:sticky top-16 lg:top-16  w-full lg:w-auto h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]
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