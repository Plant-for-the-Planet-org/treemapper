'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Trees,
  Leaf,
  Shield,
  Sprout,
  Calendar,
  User,
  MapPin,
  Filter,
  ChevronDown,
  Eye,
  Activity,
  Clock,
  Target,
  Camera,
  Info,
  Layers,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Search,
  ChevronUp,
  Ruler,
  Heart,
  AlertTriangle,
  TrendingUp,
  Microscope,
  Tag,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Expand,
  Shrink,
  Check,
  Upload,
  TreePine,
  Flag,
  CheckCircle,
  AlertCircle,
  FileText,
  Database,
  Loader
} from 'lucide-react';
import MapDisplayComponent from './component/InterventionDisplayMap';
import { useToken } from '@/context/useTokenContext';
import { deleteIntervention, getProjectIntervention } from '@shared-core/fetchApi/api.fetch';
import useProjectStore from '@shared-core/store/useProjectStore';
import Image from 'next/image'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation';

import { Trash2, } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const interventionTypeIcons = {
  'enrichment-planting': Trees,
  'direct-seeding': Sprout,
  'removal-invasive-species': Shield,
  'maintenance': Activity,
  'fencing': Shield,
  'fire-patrol': Shield,
  'soil-improvement': Leaf,
  'grass-suppression': Leaf,
  'single-tree-registration': Trees,
  'multi-tree-registration': Trees,
  'other-intervention': Target
};

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

const InterventionSkeleton = () => (
  <div className="p-3 border-b border-gray-100 animate-pulse">
    <div className="flex items-start space-x-3">
      <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="w-24 h-3 bg-gray-200 rounded"></div>
          <div className="w-12 h-4 bg-gray-200 rounded-full"></div>
        </div>
        <div className="w-16 h-2 bg-gray-200 rounded"></div>
        <div className="flex items-center justify-between">
          <div className="w-16 h-3 bg-gray-200 rounded"></div>
          <div className="w-10 h-3 bg-gray-200 rounded-full"></div>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded"></div>
        <div className="flex space-x-6">
          <div className="w-16 h-2 bg-gray-200 rounded"></div>
          <div className="w-12 h-2 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

const DetailsSkeleton = () => (
  <div className="animate-pulse">
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="w-36 h-5 bg-gray-200 rounded mb-1"></div>
          <div className="w-20 h-3 bg-gray-200 rounded"></div>
        </div>
        <div className="flex space-x-2">
          <div className="w-12 h-5 bg-gray-200 rounded-full"></div>
          <div className="w-16 h-5 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-3">
            <div className="w-6 h-6 bg-gray-200 rounded mb-1"></div>
            <div className="w-12 h-4 bg-gray-200 rounded mb-1"></div>
            <div className="w-8 h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ============================================================================
// TOOLTIP COMPONENT
// ============================================================================

const TreeTooltip = ({ tree, isVisible, position }) => {
  if (!isVisible || !tree) return null;

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: 'translateY(-100%)'
      }}
    >
      {tree.image && <div className="relative w-full h-20 mb-2 bg-gray-100 rounded overflow-hidden">
        <Image
          src={`https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/development/tree/${tree.image}`}
          alt="Tree image"
          fill
          className="object-cover"
        />
      </div>}

      <div className="flex items-center space-x-2 mb-2">
        <Trees className="w-3 h-3 text-[#007A49]" />
        <span className="font-medium text-gray-800 text-xs">{tree.tag || tree.hid}</span>
        <span className={`px-1.5 py-0.5 rounded-full text-xs ${tree.status === 'alive' ? 'bg-gray-100 text-gray-700' :
          tree.status === 'dead' ? 'bg-gray-200 text-gray-800' :
            'bg-gray-100 text-gray-600'
          }`}>
          {tree.status}
        </span>
      </div>

      <div className="space-y-1 text-xs">
        {tree.speciesName && (
          <div className="flex justify-between">
            <span className="text-gray-500">Species:</span>
            <span className="font-medium text-gray-700">{tree.speciesName}</span>
          </div>
        )}
        {tree.height && (
          <div className="flex justify-between">
            <span className="text-gray-500">Height:</span>
            <span className="font-medium text-gray-700">{tree.height}m</span>
          </div>
        )}
        {tree.width && (
          <div className="flex justify-between">
            <span className="text-gray-500">Width:</span>
            <span className="font-medium text-gray-700">{tree.width}m</span>
          </div>
        )}
        {tree.plantingDate && (
          <div className="flex justify-between">
            <span className="text-gray-500">Planted:</span>
            <span className="font-medium text-gray-700">
              {new Date(tree.plantingDate).toLocaleDateString()}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">Type:</span>
          <span className="font-medium text-gray-700 capitalize">{tree.treeType}</span>
        </div>
        {tree.records && tree.records.length > 0 && (
          <div className="border-t pt-1 mt-1">
            <span className="text-gray-500 text-xs">Records: {tree.records.length}</span>
            <div className="mt-0.5 text-xs text-gray-400">
              Last: {new Date(tree.records[0]?.recordedAt).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const HeaderWithFilters = ({
  filters,
  setFilters,
  searchTerm,
  setSearchTerm,
  interventionTypes,
  sites,
  handleDateChange,
  sidebarCollapsed,
  setSidebarCollapsed,
  newIntervention,
  userRole,
  bulkUpload,
  error
}) => {
  const [showFilters, setShowFilters] = useState(false);
const router = useRouter()
  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-5 py-4">
      <div className="flex flex-col gap-3">
        {/* Header Top Row */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Title and Mobile Actions */}
          <div className="flex items-start sm:items-center justify-between lg:justify-start gap-3 pt-1">
            <div className="flex items-start sm:items-center space-x-3">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="lg:hidden p-1.5 hover:bg-gray-100 rounded transition-colors"
              >
                <Menu className="h-4 w-4 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl xl:text-2xl font-semibold text-gray-800">
                  Project Interventions
                </h1>
                {error && (
                  <p className="text-red-600 text-xs mt-0.5 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {error}
                  </p>
                )}
              </div>
            </div>

            {/* Mobile Buttons */}
            <div className="flex lg:hidden items-center space-x-1">
              <button className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all">
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={newIntervention}
                className="p-1.5 bg-[#007A49] hover:bg-[#005a37] text-white rounded-lg transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden lg:flex items-center space-x-2">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center text-xs font-medium text-[#007A49] hover:text-[#005a37]"
              >
                {showFilters ? (
                  <>
                    Hide Filters <ChevronUp className="ml-1 h-3 w-3" />
                  </>
                ) : (
                  <>
                    Show Filters <ChevronDown className="ml-1 h-3 w-3" />
                  </>
                )}
              </button>
            </div>
            {userRole !== 'contributor' && <button
              onClick={()=>{router.push('/dashboard/bulkupload')}}
              className="cursor-pointer flex items-center px-4 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-xs font-medium"
            >
              <Upload className="h-3 w-3 mr-1.5" />
              Bulk Upload
            </button>}
            <button
              onClick={()=>{router.push('/dashboard/new-intervention')}}
              className="cursor-pointer flex items-center px-4 py-3 bg-[#007A49] text-white rounded-lg transition-all font-medium text-xs hover:bg-[#005a37]"
            >
              <Plus className="h-3 w-3 mr-1.5" />
              New Intervention
            </button>
          </div>
        </div>

        {/* Filters (conditionally shown) */}
        {showFilters && (
          <div className="animate-fadeIn">
            <FiltersSection
              filters={filters}
              setFilters={setFilters}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              interventionTypes={interventionTypes}
              sites={sites}
              onDateChange={handleDateChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// FILTERS COMPONENT
// ============================================================================

const FiltersSection = ({
  filters,
  setFilters,
  searchTerm,
  setSearchTerm,
  interventionTypes,
  sites,
  onDateChange
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Top Row - Search */}
      <div className="w-full flex justify-between items-center flex-wrap gap-3">
        <div className="relative w-full lg:w-48">
          <Search className="absolute left-2.5 top-2 h-3 w-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by HID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#007A49] focus:border-[#007A49]"
          />
        </div>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {/* Type Filter */}
        <select
          value={filters.type}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-3 pr-8 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#007A49]"
        >
          <option value="">All Types</option>
          {interventionTypes.map(type => (
            <option key={type} value={type}>
              {type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>

        {/* Capture Mode Filter */}
        <select
          value={filters.captureMode}
          onChange={(e) => setFilters(prev => ({ ...prev, captureMode: e.target.value }))}
          className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-3 pr-8 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#007A49]"
        >
          <option value="">All Capture Modes</option>
          <option value="on-site">On Site</option>
          <option value="off-site">Off Site</option>
          <option value="external">External</option>
          <option value="unknown">Unknown</option>
        </select>

        {/* Site Filter */}
        <select
          value={filters.projectSiteId}
          onChange={(e) => setFilters(prev => ({ ...prev, projectSiteId: e.target.value }))}
          className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-3 pr-8 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#007A49]"
        >
          <option value="">All Sites</option>
          {sites.map(site => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>

        {/* Date Filter */}
        <input
          type="date"
          value={filters.interventionStartDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-3 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#007A49]"
        />

        {/* Flag Filter */}
        <select
          value={filters.flag}
          onChange={(e) => setFilters(prev => ({ ...prev, flag: e.target.value }))}
          className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-3 pr-8 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#007A49]"
        >
          <option value="">All Items</option>
          <option value="true">Flagged Only</option>
          <option value="false">Not Flagged</option>
        </select>
      </div>
    </div>
  );
};

// ============================================================================
// INTERVENTION CARD COMPONENT
// ============================================================================

const InterventionCard = ({ intervention, isSelected, onClick }) => {
  const IconComponent = interventionTypeIcons[intervention.type] || Target;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-gray-100 text-gray-700';
      case 'completed': return 'bg-gray-200 text-gray-800';
      case 'planned': return 'bg-gray-100 text-gray-600';
      case 'failed': return 'bg-gray-200 text-gray-700';
      case 'on-hold': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getCaptureStatusColor = (status) => {
    switch (status) {
      case 'complete': return 'bg-gray-200 text-gray-800';
      case 'partial': return 'bg-gray-100 text-gray-700';
      case 'incomplete': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatInterventionType = (type) => {
    return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div
      onClick={onClick}
      className={`p-3 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-50 group
        ${isSelected ? 'bg-[#007A49]/5 border-l-2 border-l-[#007A49]' : ''}`}
    >
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-lg transition-all duration-200 flex-shrink-0 relative
          ${isSelected ? 'bg-[#007A49] shadow-sm' : 'bg-gray-100 group-hover:bg-gray-150'}`}>
          <IconComponent className={`h-4 w-4 transition-colors ${isSelected ? 'text-white' : 'text-gray-600'}`} />
          {intervention.flag && (
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full flex items-center justify-center">
              <Flag className="w-1 h-1 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center space-x-1.5">
              <h3 className="text-sm font-medium text-gray-800 truncate leading-tight">
                {formatInterventionType(intervention.type)}
              </h3>
              {intervention.hasRecords && (
                <FileText className="w-3 h-3 text-blue-500" title="Has Records" />
              )}
            </div>
            <div className="flex flex-col items-end space-y-0.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${getStatusColor(intervention.interventionStatus)}`}>
                {intervention.interventionStatus}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getCaptureStatusColor(intervention.captureStatus)}`}>
                {intervention.captureStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center text-xs text-gray-500 mb-1">
            <Calendar className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
            <span className="truncate">{formatDate(intervention.registrationDate)}</span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {intervention.hid}
            </span>
          </div>

          {intervention.flag && intervention.flagReason && (
            <div className="mb-2 p-1.5 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center space-x-0.5 mb-0.5">
                <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                <span className="text-xs font-medium text-red-700">Flagged</span>
              </div>
              {intervention.flagReason.map((reason, idx) => (
                <div key={idx} className="text-xs text-red-600">
                  {reason.title}: {reason.message}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1 text-xs text-gray-500">
            {intervention.site && (
              <span className="flex items-center">
                <MapPin className="h-2.5 w-2.5 mr-1 flex-shrink-0" />
                <span className="truncate">{intervention.site.name}</span>
              </span>
            )}

            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <Trees className="h-2.5 w-2.5 mr-1 flex-shrink-0" />
                <span>{intervention.treeCount} trees</span>
              </span>
              {intervention.species?.length > 0 && (
                <span className="flex items-center">
                  <Leaf className="h-2.5 w-2.5 mr-1 flex-shrink-0" />
                  <span>{intervention.species.length} species</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TREE CARD COMPONENT
// ============================================================================

const TreeCard = ({
  tree,
  onMouseEnter,
  onMouseLeave,
  onImageUpload,
  onImageUpdate
}) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleCameraClick = (e) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setShowImageModal(true);
    }
  };

  const handleImageAction = async (action) => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      if (action === 'upload' && onImageUpload) {
        await onImageUpload(tree.hid, selectedFile);
      } else if (action === 'update' && onImageUpdate) {
        await onImageUpdate(tree.hid, selectedFile);
      }
      handleCloseModal();
    } catch (error) {
      console.error(`Error ${action}ing image:`, error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseModal = () => {
    setShowImageModal(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div
        className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-all duration-200 cursor-pointer relative group"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Camera Button */}
        <button
          onClick={handleCameraClick}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 opacity-0 group-hover:opacity-100"
          title={tree.image ? "Update tree image" : "Upload tree image"}
        >
          <Camera className="w-3 h-3" />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Tree Image */}
        {tree.image && (
          <div className="mb-2">
            <img
              src={`https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/development/tree/${tree.image}`}
              alt={`Tree ${tree.tag || tree.hid}`}
              className="w-full h-20 object-cover rounded"
            />
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-[#007A49] rounded flex items-center justify-center">
              <Trees className="w-3 h-3 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800 text-xs">{tree.tag || tree.hid}</h4>
              <span className="text-xs text-gray-500">{tree.hid}</span>
            </div>
          </div>
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${tree.status === 'alive' ? 'bg-gray-100 text-gray-700' :
            tree.status === 'dead' ? 'bg-gray-200 text-gray-800' :
              'bg-gray-100 text-gray-600'
            }`}>
            {tree.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {tree.speciesName && (
            <div className="col-span-2 flex items-center space-x-1">
              <Leaf className="w-3 h-3 text-gray-500" />
              <span className="text-gray-700 truncate">{tree.speciesName}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Tag className="w-3 h-3 text-gray-500" />
            <span className="text-gray-700 capitalize">{tree.treeType}</span>
          </div>
          {tree.height && (
            <div className="flex items-center space-x-1">
              <Ruler className="w-3 h-3 text-gray-500" />
              <span className="text-gray-700">{tree.height}m</span>
            </div>
          )}
          {tree.plantingDate && (
            <div className="col-span-2 flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-gray-500" />
              <span className="text-gray-700">
                {new Date(tree.plantingDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {tree.records && tree.records.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Records: {tree.records.length}</span>
              <span className="text-xs text-gray-400">
                Last: {new Date(tree.records[0]?.recordedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Image Upload/Update Modal */}
      <AnimatePresence>
        {showImageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={handleCloseModal}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-lg p-4 max-w-md w-full mx-4 shadow-xl border border-gray-200"
            >
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-3 right-3 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 mb-3">
                  <Camera className="w-4 h-4 text-blue-600" />
                </div>

                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  {tree.image ? 'Update Tree Image' : 'Upload Tree Image'}
                </h3>

                <p className="text-gray-600 mb-3 text-xs">
                  {tree.image
                    ? 'Replace the current image with a new one?'
                    : 'Add an image to this tree record?'
                  }
                </p>

                {/* Tree Info */}
                <div className="bg-gray-50 rounded p-2 mb-3">
                  <p className="text-xs text-gray-700">
                    <strong>Tree:</strong> {tree.tag || tree.hid}
                  </p>
                  {tree.speciesName && (
                    <p className="text-xs text-gray-700">
                      <strong>Species:</strong> {tree.speciesName}
                    </p>
                  )}
                </div>

                {/* Image Preview */}
                {previewUrl && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-1">Preview:</p>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full max-h-32 object-cover rounded border border-gray-200"
                    />
                  </div>
                )}

                {/* Current Image (if exists) */}
                {tree.image && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-1">Current Image:</p>
                    <img
                      src={tree.image}
                      alt="Current tree image"
                      className="w-full max-h-24 object-cover rounded border border-gray-200"
                    />
                  </div>
                )}

                {/* Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={handleCloseModal}
                    disabled={isUploading}
                    className="flex-1 px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded font-medium transition-colors disabled:opacity-50 text-xs"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => handleImageAction(tree.image ? 'update' : 'upload')}
                    disabled={isUploading || !selectedFile}
                    className="flex-1 px-3 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1"></div>
                        {tree.image ? 'Updating...' : 'Uploading...'}
                      </>
                    ) : (
                      <>
                        {tree.image ? (
                          <>
                            <Upload className="w-3 h-3 mr-1" />
                            Update Image
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Upload Image
                          </>
                        )}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

// ============================================================================
// SPECIES CARD COMPONENT
// ============================================================================

const SpeciesCard = ({ species }) => (
  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-[#007A49] rounded flex items-center justify-center">
          <Leaf className="w-3 h-3 text-white" />
        </div>
        <div>
          <h4 className="font-medium text-gray-800 text-xs">
            {species.speciesName || species.otherSpeciesName || 'Unknown Species'}
          </h4>
          {species.scientificSpeciesUid && typeof species.scientificSpeciesUid === 'string' && (
            <span className="text-xs text-gray-500">ID: {species.scientificSpeciesUid}</span>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-semibold text-[#007A49]">{species.count}</div>
        <div className="text-xs text-gray-500">planted</div>
      </div>
    </div>

    <div className="flex items-center space-x-3 text-xs text-gray-500">
      <span>Unknown: {species.isUnknown ? 'Yes' : 'No'}</span>
    </div>
  </div>
);

// ============================================================================
// INTERVENTION DETAILS COMPONENT
// ============================================================================

const InterventionDetails = ({
  intervention,
  hoveredTree,
  tooltipPosition,
  onTreeHover,
  onTreeLeave,
  accessToken,
  pid,
  removeIntervention
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatInterventionType = (type) => {
    return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-gray-100 text-gray-700';
      case 'completed': return 'bg-gray-200 text-gray-800';
      case 'planned': return 'bg-gray-100 text-gray-600';
      case 'failed': return 'bg-gray-200 text-gray-700';
      case 'on-hold': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getCaptureStatusColor = (status) => {
    switch (status) {
      case 'complete': return 'bg-gray-200 text-gray-800';
      case 'partial': return 'bg-gray-100 text-gray-700';
      case 'incomplete': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await deleteIntervention(accessToken, pid, intervention.uid);
      if (response.statusCode != 200 && response.statusCode != 201) {
        toast.error("Something went wrong")
        return
      }
      setShowDeleteModal(false);
      removeIntervention(intervention)
    } catch (error) {
      console.error('Error deleting intervention:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <>
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Map Section */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 relative overflow-hidden h-64">
            <div className="absolute inset-0 flex items-center justify-center p-3">
              <MapDisplayComponent geoJSON={intervention.originalGeometry} />
            </div>
          </div>

          {/* Details Panel */}
          <div className="bg-white rounded-lg border border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {formatInterventionType(intervention.type)}
                  </h2>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <p className="text-gray-600 text-xs">ID: {intervention.hid}</p>
                    {intervention.flag && (
                      <div className="flex items-center space-x-0.5 text-red-600">
                        <Flag className="w-3 h-3" />
                        <span className="text-xs font-medium">Flagged</span>
                      </div>
                    )}
                    {intervention.hasRecords && (
                      <div className="flex items-center space-x-0.5 text-blue-600">
                        <FileText className="w-3 h-3" />
                        <span className="text-xs font-medium">Has Records</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(intervention.interventionStatus)}`}>
                    {intervention.interventionStatus}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCaptureStatusColor(intervention.captureStatus)}`}>
                    {intervention.captureStatus}
                  </span>
                  {/* Delete Button */}
                  <button
                    onClick={handleDeleteClick}
                    className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
                    title="Delete Intervention"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Flag Reasons */}
              {intervention.flag && intervention.flagReason && intervention.flagReason.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1.5" />
                    Flag Reasons
                  </h3>
                  <div className="space-y-1.5">
                    {intervention.flagReason.map((reason, index) => (
                      <div key={index} className="bg-white rounded p-2">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-medium text-red-700 text-xs">{reason.title}</span>
                          <span className="text-xs text-red-600 capitalize">{reason.level}</span>
                        </div>
                        <p className="text-xs text-red-600">{reason.message}</p>
                        <div className="text-xs text-red-500 mt-0.5">
                          Created: {new Date(reason.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overview Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {intervention.type !== 'single-tree-registration' && <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Trees className="w-5 h-5 text-gray-600" />
                    <span className="text-lg font-semibold text-gray-900">{intervention.treeCount}</span>
                  </div>
                  <p className="text-gray-700 font-medium text-xs">Trees</p>
                </div>}

                {intervention.type !== 'single-tree-registration' && <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Leaf className="w-5 h-5 text-gray-600" />
                    <span className="text-lg font-semibold text-gray-900">{intervention.species?.length || 0}</span>
                  </div>
                  <p className="text-gray-700 font-medium text-xs">Species</p>
                </div>}

                {intervention.type !== 'single-tree-registration' && <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <TreePine className="w-5 h-5 text-gray-600" />
                    <span className="text-lg font-semibold text-gray-900">{intervention.trees?.length || 0}</span>
                  </div>
                  <p className="text-gray-700 font-medium text-xs">Sample Trees</p>
                </div>}

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <CalendarIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-900">
                      {formatDate(intervention.updatedAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 font-medium text-xs">Last Update</p>
                </div>
              </div>

              {/* Species Section */}
              {intervention.species?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-800 mb-3 flex items-center">
                    <Leaf className="w-4 h-4 mr-1.5 text-[#007A49]" />
                    Species Planted
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {intervention.species.map((species, index) => (
                      <SpeciesCard key={species.uid || index} species={species} />
                    ))}
                  </div>
                </div>
              )}

              {/* Trees Section */}
              {intervention.trees?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-800 mb-3 flex items-center">
                    <Trees className="w-4 h-4 mr-1.5 text-[#007A49]" />
                    Individual Trees ({intervention.trees.length})
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                    {intervention.trees.map((tree) => (
                      <TreeCard
                        key={tree.id}
                        tree={tree}
                        onMouseEnter={(e) => onTreeHover(tree, e)}
                        onMouseLeave={onTreeLeave}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center text-sm">
                    <Info className="w-3 h-3 mr-1" />
                    Intervention Details
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Registration Date:</span>
                      <span className="font-medium text-gray-700">{formatDate(intervention.registrationDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Start Date:</span>
                      <span className="font-medium text-gray-700">{formatDate(intervention.interventionStartDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">End Date:</span>
                      <span className="font-medium text-gray-700">{formatDate(intervention.interventionEndDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Capture Mode:</span>
                      <span className="font-medium text-gray-700 capitalize">{intervention.captureMode?.replace('-', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sample Tree Count:</span>
                      <span className="font-medium text-gray-700">{intervention.sampleTreeCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Privacy:</span>
                      <span className="font-medium text-gray-700">{intervention.isPrivate ? 'Private' : 'Public'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center text-sm">
                    <MapPin className="w-3 h-3 mr-1" />
                    Location & Site
                  </h4>
                  <div className="space-y-2 text-xs">
                    {intervention.site && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Site:</span>
                          <span className="font-medium text-gray-700">{intervention.site.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Site Status:</span>
                          <span className="font-medium text-gray-700 capitalize">{intervention.site.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Site Description:</span>
                          <span className="font-medium text-gray-700">{intervention.site.description || 'N/A'}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created:</span>
                      <span className="font-medium text-gray-700">{formatDate(intervention.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Updated:</span>
                      <span className="font-medium text-gray-700">{formatDate(intervention.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata Section */}
              {intervention.metadata && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center text-sm">
                    <Database className="w-3 h-3 mr-1" />
                    Metadata
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(intervention.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tree Tooltip */}
      <TreeTooltip
        tree={hoveredTree}
        isVisible={!!hoveredTree}
        position={tooltipPosition}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ zIndex: 1000 }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={handleCancelDelete}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-lg p-4 max-w-md w-full mx-4 shadow-xl border border-gray-200"
            >
              {/* Close Button */}
              <button
                onClick={handleCancelDelete}
                className="absolute top-3 right-3 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center w-8 h-8 rounded-full bg-red-100 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>

                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  Delete Intervention
                </h3>

                <p className="text-gray-600 mb-4 text-xs">
                  Are you sure you want to delete this intervention? This action cannot be undone and will permanently remove all associated data including trees, species, and metadata.
                </p>

                <div className="bg-gray-50 rounded p-2 mb-4">
                  <p className="text-xs text-gray-700">
                    <strong>Intervention ID:</strong> {intervention.hid}
                  </p>
                  <p className="text-xs text-gray-700">
                    <strong>Type:</strong> {formatInterventionType(intervention.type)}
                  </p>
                  <p className="text-xs text-gray-700">
                    <strong>Trees:</strong> {intervention.treeCount}
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancelDelete}
                    disabled={isDeleting}
                    className="flex-1 px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded font-medium transition-colors disabled:opacity-50 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="flex-1 px-3 py-1.5 text-white bg-red-600 hover:bg-red-700 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs"
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TreeMapperUI = ({ newIntervention, bulkUpload }) => {
  const [interventions, setInterventions] = useState([]);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    captureMode: '',
    projectSiteId: '',
    interventionStartDate: '',
    flag: ''
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [hasMore, setHasMore] = useState(true);
  const [sites, setSites] = useState([]);
  const [hoveredTree, setHoveredTree] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const { accessToken } = useToken();
  const selectedProject = useProjectStore(state => state.selectedProject);
  const observerRef = useRef();

  // Get unique intervention types
  const interventionTypes = useMemo(() => {
    return [...new Set(interventions.map(i => i.type))];
  }, [interventions]);

  // Fetch interventions data
  const fetchInterventionData = async (page = 1, append = false) => {
    if (!selectedProject?.uid) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = {
        page,
        limit: pagination.limit,
        ...filters,
        searchHid: searchTerm
      };

      // Remove empty filters
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });

      const response = await getProjectIntervention(accessToken || '', selectedProject.uid, queryParams);

      if (response && response.statusCode === 200) {
        const newInterventions = response.data.intervention || [];

        if (append) {
          setInterventions(prev => [...prev, ...newInterventions]);
        } else {
          setInterventions(newInterventions);
          if (!selectedIntervention && newInterventions.length > 0) {
            setSelectedIntervention(newInterventions[0]);
          }
        }

        const newPagination = response.data.pagination;
        setPagination(newPagination);
        setHasMore(newPagination.page < newPagination.totalPages);
      } else {
        throw new Error('Failed to fetch interventions');
      }
    } catch (error) {
      console.error('Error fetching interventions:', error);
      setError(error.message || 'Failed to fetch interventions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch sites data
  const fetchSites = async () => {
    try {
      // Mock data for now
      setSites([
        { id: 1, name: "L1a Rainforest" },
        { id: 2, name: "Northern Forest" },
        { id: 3, name: "Southern Meadow" }
      ]);
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  // Load more interventions (infinite scroll)
  const loadMoreInterventions = useCallback(async () => {
    if (loading || !hasMore) return;

    const nextPage = pagination.page + 1;
    await fetchInterventionData(nextPage, true);
  }, [loading, hasMore, pagination.page, filters, searchTerm]);

  // Intersection observer for infinite scroll
  const lastInterventionElementRef = useCallback(node => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreInterventions();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, loadMoreInterventions]);

  // Tree hover handlers
  const handleTreeHover = (tree, event) => {
    setHoveredTree(tree);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleTreeLeave = () => {
    setHoveredTree(null);
  };

  // Date filter handler
  const handleDateChange = (date) => {
    setFilters(prev => ({ ...prev, interventionStartDate: date }));
  };

  // Effects
  useEffect(() => {
    if (selectedProject) {
      fetchInterventionData();
      fetchSites();
    }
  }, [selectedProject]);

      useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedProject) {
        fetchInterventionData();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters, searchTerm]);

  // Filter interventions (for display)
  const filteredInterventions = useMemo(() => {
    return interventions.sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));
  }, [interventions]);

  const removeIntervention = (i) => {
    setInterventions(prev => [...prev.filter(e => e.uid !== i.uid)]);
    setSelectedIntervention(null)
  }

  return (
    <div className="bg-gray-50 flex flex-col h-screen w-full">
      {/* Header */}
      <HeaderWithFilters
        filters={filters}
        setFilters={setFilters}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        interventionTypes={interventionTypes}
        sites={sites}
        newIntervention={newIntervention}
        bulkUpload={bulkUpload}
        userRole={selectedProject?.userRole}
        handleDateChange={handleDateChange} 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed} 
        error={error} 
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Intervention List */}
        <div className={`${sidebarCollapsed ? 'w-0 lg:w-12' : 'w-full md:w-80 lg:w-80'} 
          bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out relative mb-10`}>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex absolute -right-2.5 top-4 z-10 w-5 h-5 bg-white border border-gray-200 rounded-full items-center justify-center hover:bg-gray-50 transition-all shadow-sm"
          >
            <ChevronLeft className={`h-2.5 w-2.5 text-gray-600 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>

          {!sidebarCollapsed && (
            <>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">Interventions</h2>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                      {filteredInterventions.length} of {pagination.total}
                    </span>
                    {loading && (
                      <Loader className="w-3 h-3 animate-spin text-[#007A49]" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredInterventions.length === 0 && !loading ? (
                  <div className="p-4 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Trees className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-800 mb-1">
                      {error ? 'Error Loading Interventions' : 'No Interventions Found'}
                    </h3>
                    <p className="text-gray-600 text-xs">
                      {error ? 'Please try again later.' : 'Try adjusting your search or filters.'}
                    </p>
                    {error && (
                      <button
                        onClick={() => fetchInterventionData()}
                        className="mt-2 px-3 py-1.5 bg-[#007A49] text-white rounded hover:bg-[#005a37] transition-colors text-xs"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {filteredInterventions.map((intervention, index) => {
                      const isLast = index === filteredInterventions.length - 1;
                      return (
                        <div
                          key={intervention.id}
                          ref={isLast ? lastInterventionElementRef : null}
                        >
                          <InterventionCard
                            intervention={intervention}
                            isSelected={selectedIntervention?.id === intervention.id}
                            onClick={() => setSelectedIntervention(intervention)}
                          />
                        </div>
                      );
                    })}

                    {loading && (
                      <div className="space-y-0">
                        {[...Array(3)].map((_, i) => (
                          <InterventionSkeleton key={i} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {sidebarCollapsed && (
            <div className="hidden lg:flex flex-col items-center py-4 space-y-3">
              <div className="w-6 h-6 bg-[#007A49] rounded flex items-center justify-center">
                <Trees className="h-3 w-3 text-white" />
              </div>
              <div className="text-xs font-semibold text-gray-600 transform rotate-90 whitespace-nowrap">
                {filteredInterventions.length}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Details and Map */}
        <div className="flex-1 flex flex-col overflow-y-auto" style={{ marginBottom: 20 }}>
          {selectedIntervention ? (
            loading && !selectedIntervention ? (
              <DetailsSkeleton />
            ) : (
              <InterventionDetails
                intervention={selectedIntervention}
                hoveredTree={hoveredTree}
                tooltipPosition={tooltipPosition}
                onTreeHover={handleTreeHover}
                onTreeLeave={handleTreeLeave}
                accessToken={accessToken}
                pid={selectedProject?.uid}
                removeIntervention={removeIntervention}
              />
            )
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Eye className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Select an Intervention
                </h3>
                <p className="text-sm text-gray-600 max-w-md">
                  Choose an intervention from the sidebar to view detailed information, species data, tree records, and location mapping
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{height:100,width:'100%'}}/>
    </div>
  );
};

export default TreeMapperUI;