'use client'

import React, { useState, useEffect } from 'react';
import {
  Trees,
  Leaf,
  ChevronDown,
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
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
  uid: string;
  speciesName?: string;
  commonName?: string;
  otherSpeciesName?: string;
  scientificSpeciesId?: number;
  scientificSpeciesUid?: string;
  count: number;
  isUnknown?: boolean;
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
  commonName?: string;
  height?: number;
  width?: number;
  plantingDate?: string;
  location?: any;
  originalGeometry?: any;
  interventionSpeciesUid?: string;
  interventionSpeciesId?: number;
  scientificSpeciesId?: number;
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
  onBack?: () => void;
}

export const InterventionDetails = ({
  intervention,
  onUpdate,
  onDelete,
  accessToken,
  selectedProject,
  userDetails,
  selectedProjectDetails,
  sites = [],
  onBack
}: InterventionDetailsProps) => {
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showSpeciesDialog, setShowSpeciesDialog] = useState(false);
  const [showOwnerDialog, setShowOwnerDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    species: true,
    trees: true,
    metadata: false
  });

  const [editedSpecies, setEditSpecies] = useState<Species | null>(null);
  const [localSpecies, setLocalSpecies] = useState<Species[]>(intervention.species || []);

  useEffect(() => {
    setLocalSpecies(intervention.species || []);
  }, [intervention.species]);

  const canEditSpecies =
    selectedProjectDetails.userRole === 'owner' || selectedProjectDetails.userRole === 'admin';

  const handleSpeciesSaveComplete = (updated: Species) => {
    setLocalSpecies((prev) => prev.map((s) => (s.uid === updated.uid ? updated : s)));
    setEditSpecies(null);
  };

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
      {onBack && (
        <button
          onClick={onBack}
          className="md:hidden flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className="h-4 w-4 rotate-90" />
          Back to list
        </button>
      )}
      {/* Map Section */}
      <Card className="py-0 gap-0">
        <CardContent className="p-0">
          <div className="h-64 flex items-center justify-center overflow-hidden">
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
                <h2 className="text-xl font-semibold text-foreground">
                  {intervention.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h2>
                {intervention.flag && (
                  <FlagTooltip flagReasons={intervention.flagReason}>
                    <Badge variant="destructive" className="cursor-help">
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>ID: {intervention.hid}</span>
                <span>•</span>
                <span>Created: {new Date(intervention.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={intervention.interventionStatus === 'completed' ? 'default' : 'secondary'} className="capitalize">
                {intervention.interventionStatus}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  'capitalize',
                  intervention.captureStatus === 'complete'
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                )}
              >
                {intervention.captureStatus}
              </Badge>
              {(selectedProjectDetails.userRole === 'owner' || selectedProjectDetails.userRole === 'admin') && (
                <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                  <Pen className="h-4 w-4" />
                  Edit
                </Button>
              )}
              {(selectedProjectDetails.userRole === 'owner' || selectedProjectDetails.userRole === 'admin') && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key metrics — inline */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm border-t border-border pt-4">
            <span className="flex items-center gap-1.5">
              <Trees className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-foreground">{intervention.treeCount}</span>
              <span className="text-muted-foreground">Trees</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Leaf className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-foreground">{intervention.species?.length || 0}</span>
              <span className="text-muted-foreground">Species</span>
            </span>
            {intervention.type !== 'single-tree-registration' && (
              <span className="flex items-center gap-1.5">
                <TreePine className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">{intervention.trees?.length || 0}</span>
                <span className="text-muted-foreground">Sample Trees</span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Updated</span>
              <span className="font-semibold text-foreground">{new Date(intervention.updatedAt).toLocaleDateString()}</span>
            </span>
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
              </div>
            </div>

            <EditableField
              label="Description"
              value={intervention.description || ''}
              type="textarea"
              placeholder="Add description..."
              onSave={(value) => handleFieldUpdate('description', value)}
            />
          </CardContent>
      </Card>

      {/* Species Section */}
      {localSpecies.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('species')}
              className="flex items-center justify-between w-full text-left group"
            >
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <Leaf className="h-3.5 w-3.5 text-primary" />
                Species Planted ({localSpecies.length})
              </h3>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform group-hover:text-foreground ${expandedSections.species ? 'rotate-180' : ''
                }`} />
            </button>
          </CardHeader>

          {expandedSections.species && (
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {localSpecies.map((sp, index) => (
                  <SpeciesCard
                    key={sp.uid || index}
                    species={sp}
                    setEditSpecies={(s) => setEditSpecies(s as Species)}
                    canEdit={canEditSpecies}
                  />
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
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <Trees className="h-3.5 w-3.5 text-primary" />
                Sample Trees ({intervention.trees.length})
              </h3>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform group-hover:text-foreground ${expandedSections.trees ? 'rotate-180' : ''
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
                    intervention={intervention}
                    accessToken={accessToken}
                    selectedProject={selectedProject}
                    onUpdate={(treeHid, updates) => {
                      console.log(`Updating tree ${treeHid}:`, updates);
                      onUpdate?.(intervention.uid, {});
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
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-primary" />
              Technical Details
            </h3>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform group-hover:text-foreground ${expandedSections.metadata ? 'rotate-180' : ''
              }`} />
          </button>
        </CardHeader>

        {expandedSections.metadata && (
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registration Date:</span>
                  <span className="font-medium text-foreground">{displayDate(intervention.registrationDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capture Mode:</span>
                  <span className="font-medium text-foreground capitalize">{intervention.captureMode?.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sample Tree Count:</span>
                  <span className="font-medium text-foreground">{intervention.sampleTreeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Privacy:</span>
                  <span className="font-medium text-foreground">{intervention.isPrivate ? 'Private' : 'Public'}</span>
                </div>
              </div>

              <div className="space-y-3">
                {intervention.site && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Site:</span>
                      <span className="font-medium text-foreground">{intervention.site.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Site Status:</span>
                      <span className="font-medium text-foreground capitalize">{intervention.site.status}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Added by:</span>
                  <span className="flex items-center gap-1.5 font-medium text-foreground min-w-0">
                    <span className="w-5 h-5 bg-muted rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {intervention.user?.image ? (
                        <img src={intervention.user.image} className="h-full w-full rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="h-3 w-3 text-muted-foreground" />
                      )}
                    </span>
                    <span className="truncate">{intervention.user?.name || 'Unknown'}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium text-foreground">{displayDate(intervention.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-medium text-foreground">{displayDate(intervention.updatedAt)}</span>
                </div>
              </div>
            </div>

            {intervention.metadata && (
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-medium text-foreground mb-3">Raw Metadata</h4>
                <div className="bg-muted/40 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
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
        onClose={() => setEditSpecies(null)}
        species={editedSpecies as any}
        selectedProject={selectedProject}
        interventionId={intervention.uid}
        onSaveComplete={handleSpeciesSaveComplete as any}
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
            <Settings className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Species Management</h3>
            <p className="text-muted-foreground">
              Comprehensive species management interface will be implemented here.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Intervention</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center mt-0.5">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-foreground font-medium">
                  Are you sure you want to delete this intervention?
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  This action cannot be undone. All associated trees, species data, and records will be permanently removed.
                </p>
              </div>
            </div>

            <div className="bg-muted/40 rounded-lg p-4">
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
              <Button variant="destructive" onClick={handleDelete} className="flex-1">
                <Trash2 className="h-4 w-4" />
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
