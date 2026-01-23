'use client'

import React, { useState } from 'react';
import { Trees, Leaf, Calendar, Camera } from 'lucide-react';
import { Card, CardContent, Badge, Button } from './ui';
import { NonEditableField } from './EditableField';
import { FileUploadDialog } from './FileUploadDialog';

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

interface TreeCardProps {
  tree: Tree;
  onUpdate?: (treeHid: string, updates: Record<string, unknown>) => void;
}

export const TreeCard = ({ tree, onUpdate }: TreeCardProps) => {
  const [showImageDialog, setShowImageDialog] = useState(false);

  const handleUpdateField = async (field: string, value: unknown) => {
    console.log(`Updating tree ${tree.hid} field ${field} to:`, value);
    await onUpdate?.(tree.hid, { [field]: value });
  };

  const handleImageUpload = async (file: File) => {
    console.log(`Uploading image for tree ${tree.hid}:`, file);
    await onUpdate?.(tree.hid, { image: file });
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          {tree.image && (
            <div className="mb-3 relative group">
              <img
                src={`${process.env.NEXT_PUBLIC_CDN}/tree/${tree.image}`}
                alt={`Tree ${tree.tag || tree.hid}`}
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
                <NonEditableField
                  label="Height (m)"
                  value={tree.height?.toString() || ''}
                  type="number"
                  placeholder="0.0"
                  onSave={(value) => handleUpdateField('height', parseFloat(value))}
                />
                <NonEditableField
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
