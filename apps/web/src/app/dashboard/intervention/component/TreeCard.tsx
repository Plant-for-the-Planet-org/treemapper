'use client'

import React, { useState, useEffect } from 'react';
import { Trees, Leaf, Calendar, Camera, Pen } from 'lucide-react';
import { Card, CardContent, Badge, Button } from './ui';
import { FileUploadDialog } from './FileUploadDialog';
import EditTreeModal from './EditTreeModal';

interface TreeRecord {
  recordedAt: string;
  [key: string]: unknown;
}

interface InterventionSpecies {
  uid: string;
  scientificSpeciesId?: number;
  speciesName?: string;
  commonName?: string;
  count: number;
  isUnknown?: boolean;
}

interface Intervention {
  uid: string;
  hid: string;
  type: string;
  interventionStartDate?: string;
  originalGeometry?: any;
  species?: InterventionSpecies[];
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

interface TreeCardProps {
  tree: Tree;
  intervention: Intervention;
  accessToken: string;
  selectedProject: string;
  onUpdate?: (treeHid: string, updates: Record<string, unknown>) => void;
}

export const TreeCard = ({
  tree,
  intervention,
  accessToken,
  selectedProject,
  onUpdate,
}: TreeCardProps) => {
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [localTree, setLocalTree] = useState<Tree>(tree);

  useEffect(() => {
    setLocalTree(tree);
  }, [tree]);

  const handleImageUpload = async (file: File) => {
    console.log(`Uploading image for tree ${localTree.hid}:`, file);
    await onUpdate?.(localTree.hid, { image: file });
  };

  const handleSaveComplete = (updatedTree: any) => {
    setLocalTree((prev) => ({ ...prev, ...updatedTree }));
    onUpdate?.(localTree.hid, updatedTree);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          {localTree.image && (
            <div className="mb-3 relative group">
              <img
                src={`${process.env.NEXT_PUBLIC_CDN}/tree/${localTree.image}`}
                alt={`Tree ${localTree.tag || localTree.hid}`}
                className="w-full h-24 object-cover rounded-md"
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#007A49] rounded-md flex items-center justify-center">
                  <Trees className="w-3 h-3 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">{localTree.tag || localTree.hid}</h4>
                  <span className="text-xs text-gray-500">{localTree.hid}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge
                  variant={
                    localTree.status === 'alive'
                      ? 'success'
                      : localTree.status === 'dead'
                      ? 'error'
                      : 'warning'
                  }
                >
                  {localTree.status}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowEditModal(true)}
                  className="p-1"
                  title="Edit tree"
                >
                  <Pen className="h-3 w-3 text-gray-500" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {localTree.speciesName && (
                <div className="flex items-center gap-2">
                  <Leaf className="h-3 w-3 text-gray-400" />
                  <span className="text-sm text-gray-700 truncate">{localTree.speciesName}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Height (m)</p>
                  <p className="text-sm text-gray-900">{localTree.height ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Width (m)</p>
                  <p className="text-sm text-gray-900">{localTree.width ?? '—'}</p>
                </div>
              </div>

              {localTree.plantingDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span>Planted: {new Date(localTree.plantingDate).toLocaleDateString()}</span>
                </div>
              )}

              {localTree.records && localTree.records.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Records: {localTree.records.length}</span>
                    <span>
                      Last: {new Date(localTree.records[0]?.recordedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!localTree.image && (
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

      <EditTreeModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        tree={localTree}
        intervention={intervention}
        accessToken={accessToken}
        selectedProject={selectedProject}
        onSaveComplete={handleSaveComplete}
      />
    </>
  );
};
