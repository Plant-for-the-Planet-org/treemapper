'use client'

import React, { useState, useRef } from 'react';
import { X, Upload, FileUp, Loader } from 'lucide-react';
import { Button } from './ui';
import { Dialog, DialogHeader, DialogContent, DialogTitle } from './ui/Dialog';
import UnifiedMapComponent from '@/component/MapSelect';

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  accept: string;
  onUpload: (file: File) => Promise<void>;
  description?: string;
}

export const FileUploadDialog = ({
  open,
  onOpenChange,
  title,
  accept,
  onUpload,
  description
}: FileUploadDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

interface Intervention {
  originalGeometry?: {
    type?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface FileUploadMapDialogProps {
  intervention: Intervention;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  accept: string;
  onUpload: (geoJSON: unknown) => Promise<void>;
  description?: string;
}

export const FileUploadMapDialog = ({
  intervention,
  open,
  onOpenChange,
  title,
  accept,
  onUpload,
  description
}: FileUploadMapDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [drawnGeoJSON, setDrawnGeoJSON] = useState<unknown>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      try {
        const fileContent = await selectedFile.text();
        const parsedGeoJSON = JSON.parse(fileContent);
        setDrawnGeoJSON(parsedGeoJSON);
      } catch (error) {
        console.error('Error parsing GeoJSON file:', error);
        alert('Invalid GeoJSON file. Please upload a valid GeoJSON file.');
      }
    }
  };

  const handleUpdateGeoJSON = (geoJSON: unknown) => {
    console.log('GeoJSON updated from map:', geoJSON);
    setDrawnGeoJSON(geoJSON);
  };

  const handleSaveLocation = async () => {
    if (!drawnGeoJSON) {
      alert('Please draw a location or upload a GeoJSON file.');
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(drawnGeoJSON);
      setFile(null);
      setDrawnGeoJSON(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to update location. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setDrawnGeoJSON(null);
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
        <div style={{ width: '100%', height: "50vh" }}>
          <UnifiedMapComponent
            updateGeoJSON={handleUpdateGeoJSON}
            uploadedGeoJSON={intervention.originalGeometry}
            mode={intervention && intervention.originalGeometry && intervention.originalGeometry.type === 'Polygon' ? 'polygon' : 'point'}
          />
        </div>
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
              Upload GeoJSON File
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
              onClick={handleSaveLocation}
              disabled={!drawnGeoJSON || isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Location'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
