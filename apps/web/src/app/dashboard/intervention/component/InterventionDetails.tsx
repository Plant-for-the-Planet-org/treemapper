'use client'

import React, { useState } from 'react';
import {
  Trees,
  Leaf,
  ChevronDown,
  Info,
  Calendar as CalendarIcon,
  TreePine,
  AlertTriangle,
  FileText,
  Database,
  Trash2,
  Settings,
  User,
  Pen
} from 'lucide-react';
import { toast } from 'react-toastify';
import { deleteIntervention, editIntervention } from '@shared-core/fetchApi/api.fetch';
import { Card, CardHeader, CardContent, Badge, Button } from './ui';
import { Dialog, DialogHeader, DialogContent, DialogTitle } from './ui/Dialog';
import { EditableField, NonEditableField } from './EditableField';
import { FileUploadDialog, FileUploadMapDialog } from './FileUploadDialog';
import { FlagTooltip } from './FlagTooltip';
import { TreeCard } from './TreeCard';
import { SpeciesCard } from './SpeciesCard';
import MapDisplayComponent from './InterventionDisplayMap';
import EditSpeciesModal from './SpeciesEditModal';
import OwenrshipTransfer from './OwnershipTransferModal';
import EditInterventionModal from './EditInterventionModal';

interface Site {
  id: string | number;
  name: string;
  status?: string;
}

interface Species {
  speciesName?: string;
  otherSpeciesName?: string;
  scientificSpeciesUid?: string;
  count: number;
  uid?: string;
}

interface TreeRecord {
  recordedAt: string;
  [key: string]: unknown;
}

interface Tree {
  id: string | number;
  hid: string;
  tag?: string;
  image?: string;
  status: string;
  speciesName?: string;
  height?: number;
  width?: number;
  plantingDate?: string;
  records?: TreeRecord[];
}

interface FlagReason {
  title: string;
  level: string;
  message: string;
  createdAt: string;
}

interface UserInfo {
  id?: string | number;
  name?: string;
  image?: string;
}

interface Intervention {
  id: string | number;
  uid: string;
  hid: string;
  type: string;
  captureStatus: string;
  interventionStatus: string;
  registrationDate: string;
  interventionStartDate?: string;
  interventionEndDate?: string;
  createdAt: string;
  updatedAt: string;
  flag?: boolean;
  flagReason?: FlagReason[];
  hasRecords?: boolean;
  site?: Site;
  treeCount: number;
  sampleTreeCount?: number;
  species?: Species[];
  trees?: Tree[];
  description?: string;
  captureMode?: string;
  isPrivate?: boolean;
  user?: UserInfo;
  userId?: string | number;
  owner?: UserInfo;
  originalGeometry?: {
    type?: string;
    [key: string]: unknown;
  };
  image?: string;
  metadata?: Record<string, unknown>;
}

interface ProjectDetails {
  uid: string;
  userRole?: string;
}

interface InterventionDetailsProps {
  intervention: Intervention;
  onUpdate?: (uid: string, updates: Record<string, unknown>) => Promise<void>;
  onDelete?: (uid: string) => Promise<void>;
  accessToken: string;
  selectedProject: string;
  userDetails?: { id?: string | number };
  selectedProjectDetails: ProjectDetails;
  sites?: Site[];
}

export const InterventionDetails = ({
  intervention,
  onUpdate,
  onDelete,
  accessToken,
  selectedProject,
  userDetails,
  selectedProjectDetails,
  sites = []
}: InterventionDetailsProps) => {
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showSpeciesDialog, setShowSpeciesDialog] = useState(false);
  const [showOwnerDialog, setShowOwnerDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    species: true,
    trees: true,
    metadata: false
  });

  const [editedSpecies, setEditSpecies] = useState<Species | null>(null);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFieldUpdate = async (field: string, value: unknown) => {
    console.log(`Updating intervention ${field} to:`, value, intervention);
    const resp = await editIntervention(accessToken, {
      interventionUid: intervention.uid,
      prjid: selectedProject,
      field,
      value
    });
    console.log('Edit response:', resp);
    await onUpdate?.(intervention.uid, { [field]: value });
  };

  const handleFileUpload = async (type: string, geoJSONData: unknown) => {
    console.log(`Updating ${type} for intervention:`, geoJSONData);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('GeoJSON update successful (fake API):', {
        interventionUid: intervention.uid,
        projectId: selectedProject,
        newGeometry: geoJSONData
      });

      await onUpdate?.(intervention.uid, { originalGeometry: geoJSONData });

      toast.success('Location updated successfully!');
    } catch (error) {
      console.error('Failed to update location:', error);
      toast.error('Failed to update location. Please try again.');
      throw error;
    }
  };

  const handleDelete = async () => {
    await deleteIntervention(accessToken, selectedProject, intervention.uid);
    await onDelete?.(intervention.uid);
    setShowDeleteDialog(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const displayDate = (dateString?: string) => {
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
        <CardContent style={{ padding: 0, margin: 0 }}>
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
              {(selectedProjectDetails.userRole === 'owner' || selectedProjectDetails.userRole === 'admin' || intervention.userId === userDetails?.id) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                  className="text-gray-700 hover:text-gray-900"
                >
                  <Pen className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              {selectedProjectDetails.userRole === 'owner' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
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
                  <Trees className="h-5 w-5 text-gray-600" />
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

              {intervention.type !== 'single-tree-registration' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <TreePine className="h-5 w-5 text-gray-600" />
                    <span className="text-2xl font-semibold text-gray-900">{intervention.trees?.length || 0}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Sample Trees</p>
                </div>
              )}

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

                <NonEditableField
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
                        {intervention.user && intervention.user.image ? (
                          <img src={`${intervention.user.image}`} className="h-full w-full rounded-full" referrerPolicy="no-referrer" />
                        ) : (
                          <User className="h-3 w-3 text-gray-600" />
                        )}
                      </div>
                      <span className="text-sm text-gray-900">
                        {intervention.user && intervention.user.name ? intervention.user.name : 'Update Owner'}
                      </span>
                    </div>
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

            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
              {/* Action buttons placeholder */}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Species Section */}
      {intervention.species && intervention.species.length > 0 && (
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
                  <SpeciesCard key={species.uid || index} species={species} setEditSpecies={setEditSpecies} editSpecies={editedSpecies} />
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Trees Section */}
      {intervention.trees && intervention.trees.length > 0 && (
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

      {/* Modals */}
      <EditSpeciesModal
        accessToken={accessToken}
        isOpen={editedSpecies !== null}
        onClose={() => { setEditSpecies(null) }}
        species={editedSpecies}
        selectedProject={selectedProject}
        interventionId={intervention.uid}
      />

      <FileUploadMapDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        title="Update Location"
        intervention={intervention}
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

      <OwenrshipTransfer
        isModalOpen={showOwnerDialog}
        setIsModalOpen={setShowOwnerDialog}
        intervention={intervention}
        owner={intervention.owner}
        handleTransferComplete={() => { }}
        selectedProject={selectedProjectDetails.uid}
        token={accessToken}
      />

      {/* Species Management Dialog */}
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

      {/* Edit Intervention Modal */}
      <EditInterventionModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        intervention={intervention}
        accessToken={accessToken}
        selectedProject={selectedProject}
        sites={sites}
        onSaveComplete={(updatedIntervention) => {
          onUpdate?.(intervention.uid, updatedIntervention);
          setShowEditModal(false);
        }}
      />
    </div>
  );
};
