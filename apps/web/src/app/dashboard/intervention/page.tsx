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
  Loader,
  Edit2,
  Save,
  FileImage,
  Users,
  Trash2,
  UserPlus,
  FileUp,
  Settings,
  Pen
} from 'lucide-react';
import { getProjectIntervention } from '@shared-core/fetchApi/api.fetch';
import useProjectStore from '@shared-core/store/useProjectStore';
import { useToken } from '@/context/useTokenContext';
import { spec } from 'node:test/reporters';
import { useRouter } from 'next/navigation';
import MapDisplayComponent from './component/InterventionDisplayMap';
import EditSpeciesModal from './component/SpeciesEditModal';
import OwenrshipTransfer from './component/OwnershipTransferModal';
// Mock API functions - replace with your actual API calls
const mockApiCall = (delay = 1000) => new Promise(resolve => setTimeout(resolve, delay));

// Shadcn-style Components
const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`px-6 py-4 border-b border-gray-100 ${className}`} {...props}>
    {children}
  </div>
);

const CardContent = ({ children, className = '', ...props }) => (
  <div className={`px-6 py-4 ${className}`} {...props}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default', className = '', ...props }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    outline: 'bg-white border border-gray-200 text-gray-700'
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};

const Button = ({ children, variant = 'default', size = 'default', className = '', disabled = false, ...props }) => {
  const variants = {
    default: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300',
    primary: 'bg-[#007A49] border border-[#007A49] text-white hover:bg-[#005a37] hover:border-[#005a37]',
    ghost: 'text-gray-700 hover:bg-gray-100 border-transparent',
    outline: 'border border-gray-200 text-gray-700 hover:bg-gray-50'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    default: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#007A49] focus:ring-offset-2 ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className = '', ...props }) => (
  <input
    className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all ${className}`}
    {...props}
  />
);

const Textarea = ({ className = '', ...props }) => (
  <textarea
    className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all resize-none ${className}`}
    {...props}
  />
);

const Select = ({ children, value, onValueChange, placeholder = "Select...", ...props }) => (
  <select
    value={value}
    onChange={(e) => onValueChange?.(e.target.value)}
    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all"
    {...props}
  >
    <option value="" disabled>{placeholder}</option>
    {children}
  </select>
);

// Tooltip Component for Flags
const FlagTooltip = ({ flagReasons, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!flagReasons || flagReasons.length === 0) return children;

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <h4 className="font-medium text-red-700 mb-2 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Data Issues Found
          </h4>
          <div className="space-y-2">
            {flagReasons.map((reason, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-red-800 text-sm">{reason.title}</span>
                  <Badge variant="error" className="text-xs">
                    {reason.level}
                  </Badge>
                </div>
                <p className="text-sm text-red-700">{reason.message}</p>
                <p className="text-xs text-red-500 mt-1">
                  {new Date(reason.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Modal Dialog Component
const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        {children}
      </div>
    </div>
  );
};

const DialogHeader = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

const DialogContent = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const DialogTitle = ({ children, className = '' }) => (
  <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h2>
);

// Editable Field Component
const EditableField = ({
  value,
  onSave,
  type = 'text',
  placeholder = '',
  className = '',
  displayValue = null,
  label = '',
  required = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleSave = async () => {
    if (required && !editValue.trim()) {
      alert('This field is required');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Save failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <div className="flex items-start gap-2">
          {type === 'textarea' ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              className={className}
              rows={3}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          ) : type === 'number' ? (
            <Input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              className={className}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          ) : type === 'date' ? (
            <Input
              type="date"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className={className}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          ) : (
            <Input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              className={className}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          )}
          <div className="flex gap-1 flex-shrink-0">
            <Button size="sm" variant="primary" onClick={handleSave} disabled={isLoading}>
              {isLoading ? <Loader className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isLoading}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      {label && <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>}
      <div className="flex items-center gap-2">
        <span className={`text-sm ${value ? 'text-gray-900' : 'text-gray-400'} flex-1`}>
          {displayValue || value || placeholder || 'Not set'}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsEditing(true)}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

// File Upload Dialog
const FileUploadDialog = ({ open, onOpenChange, title, accept, onUpload, description }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      await onUpload(file);
      setFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle>{title}</DialogTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DialogHeader>
      <DialogContent className="space-y-4">
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}

        <div className="space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full justify-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
            {file && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileUp className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// User Search Dialog
const UserSearchDialog = ({ open, onOpenChange, onSelect, currentOwner }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Mock API call - replace with actual user search
      await mockApiCall(500);
      setSearchResults([
        { id: 1, name: 'John Doe', email: 'john@example.com', avatar: null },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', avatar: null },
      ]);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, handleSearch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Change Owner</DialogTitle>
      </DialogHeader>
      <DialogContent className="space-y-4">
        <div>
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  onSelect(user);
                  onOpenChange(false);
                }}
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
            ))
          ) : searchTerm.trim() ? (
            <div className="text-center py-8 text-gray-500">
              No users found
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Start typing to search for users
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Intervention Type Icons
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

// Intervention Card Component
const InterventionCard = ({ intervention, isSelected, onClick }) => {
  const IconComponent = interventionTypeIcons[intervention.type] || Target;

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'default';
      case 'failed': return 'error';
      case 'planned': return 'warning';
      default: return 'outline';
    }
  };

  const getCaptureStatusVariant = (status) => {
    switch (status) {
      case 'complete': return 'success';
      case 'partial': return 'warning';
      case 'incomplete': return 'error';
      default: return 'outline';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300 ${isSelected ? 'ring-2 ring-[#007A49] bg-[#007A49]/5 border-[#007A49]' : ''
        }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`relative p-2.5 rounded-lg transition-all duration-200 ${isSelected ? 'bg-[#007A49] text-white' : 'bg-gray-100 text-gray-600'
            }`}>
            <IconComponent className="h-4 w-4" />
            {intervention.flag && (
              <FlagTooltip flagReasons={intervention.flagReason}>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-2 h-2 text-white" />
                </div>
              </FlagTooltip>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-gray-900 text-sm leading-5">
                {intervention.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <div className="flex flex-col gap-1 ml-2">
                <Badge variant={getCaptureStatusVariant(intervention.captureStatus)}>
                  {intervention.captureStatus}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span>{formatDate(intervention.registrationDate)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                  {intervention.hid}
                </span>
                {intervention.hasRecords && (
                  <FileText className="h-3 w-3 text-blue-500" title="Has Records" />
                )}
              </div>

              {intervention.site && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span className="truncate">{intervention.site.name}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-gray-500">
                <span className="flex items-center gap-1">
                  <Trees className="h-3 w-3" />
                  <span className="font-medium">{intervention.treeCount}</span>
                  <span>trees</span>
                </span>
                {intervention.species?.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Leaf className="h-3 w-3" />
                    <span className="font-medium">{intervention.species.length}</span>
                    <span>species</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Tree Card Component
const TreeCard = ({ tree, onUpdate }) => {
  const [showImageDialog, setShowImageDialog] = useState(false);

  const handleUpdateField = async (field, value) => {
    console.log(`Updating tree ${tree.hid} field ${field} to:`, value);
    await mockApiCall(); // Replace with actual API call
    await onUpdate?.(tree.hid, { [field]: value });
  };

  const handleImageUpload = async (file) => {
    console.log(`Uploading image for tree ${tree.hid}:`, file);
    await mockApiCall(); // Replace with actual API call
    await onUpdate?.(tree.hid, { image: file });
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          {tree.image && (
            <div className="mb-3 relative group">
              <img
                src={`https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/production/tree/${tree.image}`}
                alt={`Tree ${tree.tag || tree.hid}`}
                className="w-full h-24 object-cover rounded-md"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setShowImageDialog(true)}
              >
                <Camera className="h-3 w-3" />
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#007A49] rounded-md flex items-center justify-center">
                  <Trees className="w-3 h-3 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">{tree.tag || tree.hid}</h4>
                  <span className="text-xs text-gray-500">{tree.hid}</span>
                </div>
              </div>
              <Badge variant={tree.status === 'alive' ? 'success' : tree.status === 'dead' ? 'error' : 'warning'}>
                {tree.status}
              </Badge>
            </div>

            <div className="space-y-3">
              {tree.speciesName && (
                <div className="flex items-center gap-2">
                  <Leaf className="h-3 w-3 text-gray-400" />
                  <span className="text-sm text-gray-700 truncate">{tree.speciesName}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <EditableField
                  label="Height (m)"
                  value={tree.height?.toString() || ''}
                  type="number"
                  placeholder="0.0"
                  onSave={(value) => handleUpdateField('height', parseFloat(value))}
                />
                <EditableField
                  label="Width (m)"
                  value={tree.width?.toString() || ''}
                  type="number"
                  placeholder="0.0"
                  onSave={(value) => handleUpdateField('width', parseFloat(value))}
                />
              </div>

              {tree.plantingDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span>Planted: {new Date(tree.plantingDate).toLocaleDateString()}</span>
                </div>
              )}

              {tree.records && tree.records.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Records: {tree.records.length}</span>
                    <span>Last: {new Date(tree.records[0]?.recordedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>

            {!tree.image && (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setShowImageDialog(true)}
              >
                <Camera className="h-3 w-3 mr-2" />
                Add Image
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <FileUploadDialog
        open={showImageDialog}
        onOpenChange={setShowImageDialog}
        title="Upload Tree Image"
        accept="image/*"
        description="Upload a high-quality image of this tree for monitoring purposes."
        onUpload={handleImageUpload}
      />
    </>
  );
};

const SpeciesCard = ({ species, setEditSpecies, editSpecies }) => {
  return (
    <Card className="hover:shadow-sm transition-shadow" onClick={() => { setEditSpecies(species) }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#007A49] rounded-md flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-gray-900 text-sm leading-5">
                {species.speciesName || species.otherSpeciesName || 'Unknown Species'}
              </h4>
              {species.scientificSpeciesUid && (
                <span className="text-xs text-gray-500">ID: {species.scientificSpeciesUid}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-[#007A49]">{species.count}</div>
            <div className="text-xs text-gray-500">planted</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Filters Section Component
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
    <div className="space-y-4">
      {/* Search */}

      {/* Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <Select
          value={filters.type}
          onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
          placeholder="All Types"
        >
          {interventionTypes.map(type => (
            <option key={type} value={type}>
              {type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </Select>

        <Select
          value={filters.captureMode}
          onValueChange={(value) => setFilters(prev => ({ ...prev, captureMode: value }))}
          placeholder="All Capture Modes"
        >
          <option value="on-site">On Site</option>
          <option value="off-site">Off Site</option>
          <option value="external">External</option>
          <option value="unknown">Unknown</option>
        </Select>

        <Select
          value={filters.projectSiteId}
          onValueChange={(value) => setFilters(prev => ({ ...prev, projectSiteId: value }))}
          placeholder="All Sites"
        >
          {sites.map(site => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </Select>

        <Input
          type="date"
          value={filters.interventionStartDate}
          onChange={(e) => onDateChange(e.target.value)}
          placeholder="Filter by date"
        />

        <Select
          value={filters.flag}
          onValueChange={(value) => setFilters(prev => ({ ...prev, flag: value }))}
          placeholder="All Items"
        >
          <option value="true">Flagged Only</option>
          <option value="false">Not Flagged</option>
        </Select>
      </div>
    </div>
  );
};

// Header Component
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

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0">
      <div className="space-y-4">
        {/* Header Top Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Desktop Actions */}
          <div className="flex items-center gap-3">
            <div className="relative" style={{ position: 'absolute', left: 20, width: "20vw" }}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by HID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className="hidden lg:flex"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>

            {userRole !== 'contributor' && (
              <Button variant="outline" onClick={bulkUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
            )}

            <Button onClick={newIntervention}>
              <Plus className="h-4 w-4 mr-2" />
              New Intervention
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="border-t border-gray-100 pt-4">
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

// Intervention Details Component
const InterventionDetails = ({ intervention, onUpdate, onDelete, accessToken, selectedProject }) => {
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showSpeciesDialog, setShowSpeciesDialog] = useState(false);
  const [showOwnerDialog, setShowOwnerDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    species: true,
    trees: true,
    metadata: false
  });

  const [eidtedSpecies, setEditSpecies] = useState(null)

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFieldUpdate = async (field, value) => {
    console.log(`Updating intervention ${field} to:`, value);
    await mockApiCall();
    await onUpdate?.(intervention.uid, { [field]: value });
  };

  const handleFileUpload = async (type, file) => {
    console.log(`Uploading ${type} for intervention:`, file);
    await mockApiCall();
    await onUpdate?.(intervention.uid, { [type]: file });
  };

  const handleOwnerChange = async (newOwner) => {
    console.log('Changing owner to:', newOwner);
    await mockApiCall();
    await onUpdate?.(intervention.uid, { ownerId: newOwner.id });
  };

  const handleDelete = async () => {
    console.log('Deleting intervention:', intervention.uid);
    await mockApiCall();
    await onDelete?.(intervention.uid);
    setShowDeleteDialog(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const displayDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Map Section */}
      <Card>
        <CardContent style={{ padding: 0, margin: 0, oveflow: 'hidden' }}>
          <div className="h-64 rounded-lg flex items-center justify-center" style={{ overflow: "hidden" }}>
            <MapDisplayComponent geoJSON={intervention.originalGeometry} />
          </div>
        </CardContent>
      </Card>

      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  {intervention.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h2>
                {intervention.flag && (
                  <FlagTooltip flagReasons={intervention.flagReason}>
                    <Badge variant="error" className="cursor-help">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Flagged
                    </Badge>
                  </FlagTooltip>
                )}
                {intervention.hasRecords && (
                  <Badge variant="outline">
                    <FileText className="h-3 w-3 mr-1" />
                    Has Records
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>ID: {intervention.hid}</span>
                <span>•</span>
                <span>Created: {new Date(intervention.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={intervention.interventionStatus === 'completed' ? 'success' : 'default'}>
                {intervention.interventionStatus}
              </Badge>
              <Badge variant={intervention.captureStatus === 'complete' ? 'success' : 'warning'}>
                {intervention.captureStatus}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Section */}
      <Card>
        <CardHeader>
          <button
            onClick={() => toggleSection('overview')}
            className="flex items-center justify-between w-full text-left group"
          >
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Info className="h-4 w-4 text-[#007A49]" />
              Overview
            </h3>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform group-hover:text-gray-700 ${expandedSections.overview ? 'rotate-180' : ''
              }`} />
          </button>
        </CardHeader>

        {expandedSections.overview && (
          <CardContent className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Trees className="h-5 h-5 text-gray-600" />
                  <span className="text-2xl font-semibold text-gray-900">{intervention.treeCount}</span>
                </div>
                <p className="text-sm font-medium text-gray-700">Trees</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Leaf className="h-5 w-5 text-gray-600" />
                  <span className="text-2xl font-semibold text-gray-900">{intervention.species?.length || 0}</span>
                </div>
                <p className="text-sm font-medium text-gray-700">Species</p>
              </div>

              {intervention.type !== 'single-tree-registration' && <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <TreePine className="h-5 w-5 text-gray-600" />
                  <span className="text-2xl font-semibold text-gray-900">{intervention.trees?.length || 0}</span>
                </div>
                <p className="text-sm font-medium text-gray-700">Sample Trees</p>
              </div>}

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <CalendarIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    {new Date(intervention.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700">Last Update</p>
              </div>
            </div>

            {/* Editable Fields Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <EditableField
                  label="Start Date"
                  value={formatDate(intervention.interventionStartDate)}
                  displayValue={displayDate(intervention.interventionStartDate)}
                  type="date"
                  onSave={(value) => handleFieldUpdate('interventionStartDate', value)}
                />

                <EditableField
                  label="Tree Count"
                  value={intervention.treeCount?.toString() || '0'}
                  type="number"
                  onSave={(value) => handleFieldUpdate('treeCount', parseInt(value))}
                />
              </div>

              <div className="space-y-4">
                <EditableField
                  label="End Date"
                  value={formatDate(intervention.interventionEndDate)}
                  displayValue={displayDate(intervention.interventionEndDate)}
                  type="date"
                  onSave={(value) => handleFieldUpdate('interventionEndDate', value)}
                />

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Owner</label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        {intervention.user && intervention.user.image ? <img src={`${intervention.user.image}`} className="h-full w-full rounded-full" /> : <User className="h-3 w-3 text-gray-600" />
                        }
                      </div>
                      <span className="text-sm text-gray-900">{intervention.user && intervention.user.name ? intervention.user.name : 'Update Owner'}</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setShowOwnerDialog(true)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <EditableField
              label="Description"
              value={intervention.description || ''}
              type="textarea"
              placeholder="Add description..."
              onSave={(value) => handleFieldUpdate('description', value)}
            />

            {/* Action Buttons */}
            {/* <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setShowLocationDialog(true)}>
                <MapPin className="h-4 w-4 mr-2" />
                Update Location
              </Button>
              <Button variant="outline" onClick={() => setShowImageDialog(true)}>
                <FileImage className="h-4 w-4 mr-2" />
                {intervention.image ? 'Update Image' : 'Add Image'}
              </Button>
              <Button variant="outline" onClick={() => setShowSpeciesDialog(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Manage Species
              </Button>
            </div> */}
          </CardContent>
        )}
      </Card>

      {/* Species Section */}
      {intervention.species?.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('species')}
              className="flex items-center justify-between w-full text-left group"
            >
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Leaf className="h-4 w-4 text-[#007A49]" />
                Species Planted ({intervention.species.length})
              </h3>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform group-hover:text-gray-700 ${expandedSections.species ? 'rotate-180' : ''
                }`} />
            </button>
          </CardHeader>

          {expandedSections.species && (
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {intervention.species.map((species, index) => (
                  <SpeciesCard key={species.uid || index} species={species} setEditSpecies={setEditSpecies} editSpecies={eidtedSpecies} />
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Trees Section */}
      {intervention.trees?.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('trees')}
              className="flex items-center justify-between w-full text-left group"
            >
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Trees className="h-4 w-4 text-[#007A49]" />
                Sample Trees ({intervention.trees.length})
              </h3>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform group-hover:text-gray-700 ${expandedSections.trees ? 'rotate-180' : ''
                }`} />
            </button>
          </CardHeader>

          {expandedSections.trees && (
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {intervention.trees.map((tree) => (
                  <TreeCard
                    key={tree.id}
                    tree={tree}
                    onUpdate={(treeHid, updates) => {
                      console.log(`Updating tree ${treeHid}:`, updates);
                    }}
                  />
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Metadata Section */}
      <Card>
        <CardHeader>
          <button
            onClick={() => toggleSection('metadata')}
            className="flex items-center justify-between w-full text-left group"
          >
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Database className="h-4 w-4 text-[#007A49]" />
              Technical Details
            </h3>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform group-hover:text-gray-700 ${expandedSections.metadata ? 'rotate-180' : ''
              }`} />
          </button>
        </CardHeader>

        {expandedSections.metadata && (
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Registration Date:</span>
                  <span className="font-medium text-gray-900">{displayDate(intervention.registrationDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Capture Mode:</span>
                  <span className="font-medium text-gray-900 capitalize">{intervention.captureMode?.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sample Tree Count:</span>
                  <span className="font-medium text-gray-900">{intervention.sampleTreeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Privacy:</span>
                  <span className="font-medium text-gray-900">{intervention.isPrivate ? 'Private' : 'Public'}</span>
                </div>
              </div>

              <div className="space-y-3">
                {intervention.site && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Site:</span>
                      <span className="font-medium text-gray-900">{intervention.site.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Site Status:</span>
                      <span className="font-medium text-gray-900 capitalize">{intervention.site.status}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">{displayDate(intervention.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium text-gray-900">{displayDate(intervention.updatedAt)}</span>
                </div>
              </div>
            </div>

            {intervention.metadata && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="font-medium text-gray-900 mb-3">Raw Metadata</h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(intervention.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <EditSpeciesModal
        accessToken={accessToken}
        // setSelectedSpecies={setEditSpecies}
        // selectedSpecies={eidtedSpecies}
        isOpen={eidtedSpecies !== null}
        onClose={() => { setEditSpecies(null) }}
        species={eidtedSpecies}
        selectedProject={selectedProject}
        interventionId={intervention.uid}
      />

      {/* File Upload Dialogs */}
      <FileUploadDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        title="Update Location"
        accept=".geojson,.kml,.json"
        description="Upload a GeoJSON or KML file to update the intervention location."
        onUpload={(file) => handleFileUpload('location', file)}
      />

      <FileUploadDialog
        open={showImageDialog}
        onOpenChange={setShowImageDialog}
        title={intervention.image ? 'Update Image' : 'Add Image'}
        accept="image/*"
        description="Upload a representative image for this intervention."
        onUpload={(file) => handleFileUpload('image', file)}
      />

      {/* User Search Dialog */}
      {/* <UserSearchDialog
        open={showOwnerDialog}
        onOpenChange={setShowOwnerDialog}
        onSelect={handleOwnerChange}
        currentOwner={intervention.createdBy}
      /> */}
      <OwenrshipTransfer isModalOpen={showOwnerDialog} setIsModalOpen={setShowOwnerDialog} intervention={intervention} owner={intervention.owner} handleTransferComplete={()=>{}} selectedProject={selectedProject.uid} token={accessToken} />

      {/* Species Management Placeholder */}
      <Dialog open={showSpeciesDialog} onOpenChange={setShowSpeciesDialog}>
        <DialogHeader>
          <DialogTitle>Manage Species</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="text-center py-8">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Species Management</h3>
            <p className="text-gray-600">
              Comprehensive species management interface will be implemented here.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogHeader>
          <DialogTitle className="text-red-900">Delete Intervention</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">
                  Are you sure you want to delete this intervention?
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  This action cannot be undone. All associated trees, species data, and records will be permanently removed.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm space-y-1">
                <div><strong>ID:</strong> {intervention.hid}</div>
                <div><strong>Type:</strong> {intervention.type.replace(/-/g, ' ')}</div>
                <div><strong>Trees:</strong> {intervention.treeCount}</div>
                <div><strong>Species:</strong> {intervention.species?.length || 0}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 border-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Intervention
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Main TreeMapperUI Component
const TreeMapperUI = () => {
  const [interventions, setInterventions] = useState([]);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter()
  const [filters, setFilters] = useState({
    type: '',
    captureMode: '',
    projectSiteId: '',
    interventionStartDate: '',
    registrationDate: '', // Added this
    userId: '', // Added this
    species: [], // Added this
    flag: '',
    sortOrder: 'desc' // Added this
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

  // Remove the useMemo for filteredInterventions since we're now filtering on the server
  const filteredInterventions = useMemo(() => {
    return interventions; // Server already filters, just return as-is
  }, [interventions]);

  const { accessToken } = useToken();
  const selectedProject = useProjectStore(state => state.selectedProject);
  const observerRef = useRef();

  // Get unique intervention types
  const interventionTypes = useMemo(() => {
    return [...new Set(interventions.map(i => i.type))];
  }, [interventions]);

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch interventions data
  const fetchInterventionData = async (page = 1, append = false) => {
    if (!selectedProject?.uid) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = {
        page,
        limit: pagination.limit,
        searchHid: debouncedSearchTerm || undefined,
        // Apply all filters
        type: filters.type || undefined,
        captureMode: filters.captureMode || undefined,
        projectSiteId: filters.projectSiteId ? parseInt(filters.projectSiteId) : undefined,
        interventionStartDate: filters.interventionStartDate || undefined,
        registrationDate: filters.registrationDate || undefined,
        userId: filters.userId ? parseInt(filters.userId) : undefined,
        species: filters.species && filters.species.length > 0 ? filters.species : undefined,
        flag: filters.flag !== '' ? (filters.flag === 'true' || filters.flag === true) : undefined,
        sortOrder: filters.sortOrder || 'desc'
      };

      // Remove empty/undefined filters
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });

      console.log('Fetching with filters:', queryParams); // Debug log

      const response = await getProjectIntervention(accessToken || '', selectedProject.uid, queryParams);

      if (response && response.statusCode === 200) {
        const newInterventions = response.data.intervention || [];

        if (append) {
          setInterventions(prev => [...prev, ...newInterventions]);
        } else {
          setInterventions(newInterventions);
          // Reset selection if no interventions match filters
          if (newInterventions.length === 0) {
            setSelectedIntervention(null);
          } else if (!selectedIntervention || !newInterventions.find(i => i.id === selectedIntervention.id)) {
            setSelectedIntervention(newInterventions[0]);
          }
        }

        const newPagination = response.data.pagination;
        setPagination(newPagination);
        setHasMore(newPagination.page < newPagination.totalPages);
      } else {
        throw new Error(response?.message || 'Failed to fetch interventions');
      }
    } catch (error) {
      console.error('Error fetching interventions:', error);
      setError(error.message || 'Failed to fetch interventions');
      if (!append) {
        setInterventions([]);
        setSelectedIntervention(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (selectedProject) {
      fetchInterventionData();
    }
  }, [selectedProject]);

  // Refetch when filters change
  useEffect(() => {
    if (selectedProject) {
      setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
      fetchInterventionData(1, false); // Fetch from page 1, don't append
    }
  }, [filters, debouncedSearchTerm, selectedProject]);

  // Custom hook for debouncing (if not already available)
  function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  }

  // Enhanced filter handlers
  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filterKey]: value };
      console.log('Filter changed:', filterKey, value, 'New filters:', newFilters); // Debug log
      return newFilters;
    });
  };

  const handleDateChange = (date) => {
    handleFilterChange('interventionStartDate', date);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      type: '',
      captureMode: '',
      projectSiteId: '',
      interventionStartDate: '',
      registrationDate: '',
      userId: '',
      species: [],
      flag: '',
      sortOrder: 'desc'
    });
    setSearchTerm('');
  };

  // Load more for pagination
  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = pagination.page + 1;
      fetchInterventionData(nextPage, true);
    }
  };

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, loading]);

  const handleInterventionUpdate = async (uid, updates) => {
    console.log('Updating intervention:', uid, updates);
    // Implement intervention update logic
    // After update, refresh the current page
    fetchInterventionData(pagination.page);
  };

  const handleInterventionDelete = async (uid) => {
    console.log('Deleting intervention:', uid);
    // Implement intervention delete logic
    setSelectedIntervention(null);
    // Refresh after delete
    fetchInterventionData(pagination.page);
  };

  // Calculate active filter count for UI
  const activeFilterCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== '' && value !== null && value !== undefined;
  }).length + (searchTerm ? 1 : 0);

  return (
    <div className="bg-gray-50 flex flex-col h-screen">
      <HeaderWithFilters
        filters={filters}
        setFilters={setFilters}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        interventionTypes={interventionTypes}
        sites={sites}
        newIntervention={() => { router.push('/dashboard/new-intervention') }}
        bulkUpload={() => { router.push('/dashboard/bulkupload') }}
        userRole={selectedProject?.userRole}
        handleDateChange={handleDateChange}
        handleFilterChange={handleFilterChange} // Pass the new handler
        clearAllFilters={clearAllFilters} // Pass clear function
        activeFilterCount={activeFilterCount} // Pass active filter count
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        error={error}
        loading={loading}
      />

      <div className="flex-1 flex">
        <div className={`${sidebarCollapsed ? 'w-0 lg:w-16' : 'w-full md:w-96 lg:w-96'
          } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out relative`}>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex absolute -right-3 top-6 z-10 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center hover:bg-gray-50 transition-all shadow-sm"
          >
            <ChevronLeft className={`h-3 w-3 text-gray-600 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''
              }`} />
          </button>

          {!sidebarCollapsed && (
            <>
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">Interventions</h2>
                    {activeFilterCount > 0 && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {pagination.total || filteredInterventions.length}
                    </Badge>
                    {loading && (
                      <Loader className="w-4 h-4 animate-spin text-[#007A49]" />
                    )}
                  </div>
                </div>

                {/* Show active filters summary */}
                {/* {activeFilterCount > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Clear all filters
                    </button>
                  </div>
                )} */}
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredInterventions.length === 0 && !loading ? (
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Trees className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {error ? 'Error Loading Interventions' :
                        activeFilterCount > 0 ? 'No Matching Interventions' : 'No Interventions Found'}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {error ? 'Please try again later.' :
                        activeFilterCount > 0 ? 'Try adjusting your search or filters.' :
                          'Create your first intervention to get started.'}
                    </p>
                    {error ? (
                      <Button variant="primary" size="sm" onClick={() => fetchInterventionData()}>
                        Retry
                      </Button>
                    ) : activeFilterCount > 0 ? (
                      <Button variant="outline" size="sm" onClick={clearAllFilters}>
                        Clear Filters
                      </Button>
                    ) : (
                      <Button variant="primary" size="sm" onClick={() => router.push('/dashboard/new-intervention')}>
                        Create Intervention
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {filteredInterventions.map((intervention) => (
                      <InterventionCard
                        key={intervention.id}
                        intervention={intervention}
                        isSelected={selectedIntervention?.id === intervention.id}
                        onClick={() => setSelectedIntervention(intervention)}
                      />
                    ))}

                    {hasMore && (
                      <div ref={observerRef} className="py-4 text-center">
                        {loading ? (
                          <Loader className="w-4 h-4 animate-spin text-[#007A49] mx-auto" />
                        ) : (
                          <p className="text-xs text-gray-500">Load more...</p>
                        )}
                      </div>
                    )}

                    {!hasMore && filteredInterventions.length > 0 && (
                      <div className="py-4 text-center">
                        <p className="text-xs text-gray-400">
                          Showing all {pagination.total} results
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {sidebarCollapsed && (
            <div className="hidden lg:flex flex-col items-center py-6 space-y-4">
              <div className="w-8 h-8 bg-[#007A49] rounded-lg flex items-center justify-center">
                <Trees className="h-4 w-4 text-white" />
              </div>
              <div className="text-xs font-semibold text-gray-600 transform rotate-90 whitespace-nowrap">
                {pagination.total || filteredInterventions.length}
              </div>
              {activeFilterCount > 0 && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{activeFilterCount}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedIntervention ? (
            <div className="flex-1 overflow-y-auto p-6">
              <InterventionDetails
                intervention={selectedIntervention}
                onUpdate={handleInterventionUpdate}
                onDelete={handleInterventionDelete}
                accessToken={accessToken}
                selectedProject={selectedProject.uid}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {filteredInterventions.length === 0 && activeFilterCount > 0
                    ? 'No Matching Interventions'
                    : 'Select an Intervention'}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {filteredInterventions.length === 0 && activeFilterCount > 0
                    ? 'Try adjusting your search criteria or filters to find interventions.'
                    : 'Choose an intervention from the sidebar to view detailed information, manage species data, update tree records, and access location mapping.'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {filteredInterventions.length === 0 && activeFilterCount > 0 ? (
                    <Button variant="outline" onClick={clearAllFilters}>
                      Clear All Filters
                    </Button>
                  ) : null}
                  <Button variant="primary" onClick={() => { router.push('/dashboard/new-intervention') }} className='bg-[#007A49] hover:bg-[#006B3F]'>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Intervention
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TreeMapperUI;