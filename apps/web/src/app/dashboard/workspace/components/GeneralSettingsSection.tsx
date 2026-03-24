'use client';

import { useEffect, useState } from 'react';
import { Edit3, Globe, Mail, MapPin, Palette, Phone, Save } from 'lucide-react';
import { getWorkspace, updateWorkspace } from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import { useUserStore } from '@shared-core/store/useUserStore';
import type { Workspace } from '../types';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmationModal,
  Input,
  Select,
  SelectItem,
  Textarea
} from './workspace-ui';

export function GeneralSettingsSection() {
  const { accessToken } = useToken();
  const currentUser = useUserStore((state) => state.user);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!accessToken || !currentUser?.primaryWorkspaceUid) return;
    setIsLoading(true);
    getWorkspace(accessToken, currentUser.primaryWorkspaceUid)
      .then((data) => { setWorkspace(data); })
      .finally(() => setIsLoading(false));
  }, [accessToken, currentUser?.primaryWorkspaceUid]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!workspace?.name.trim()) {
      newErrors.name = 'Workspace name is required';
    }

    if (!workspace?.slug.trim()) {
      newErrors.slug = 'Workspace slug is required';
    } else if (!/^[a-z0-9-]+$/.test(workspace?.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (workspace?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workspace.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      setShowSaveModal(true);
    }
  };

  const confirmSave = async () => {
    if (!workspace || !currentUser?.primaryWorkspaceUid) return;
    const updated = await updateWorkspace(accessToken, currentUser.primaryWorkspaceUid, {
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      email: workspace.email,
      phone: workspace.phone,
      website: workspace.website,
      address: workspace.address,
      primaryColor: workspace.primaryColor,
      secondaryColor: workspace.secondaryColor,
      type: workspace.type,
    });
    if (updated && !updated.error) {
      setWorkspace(updated);
    }
    setIsEditing(false);
    setShowSaveModal(false);
  };

  if (isLoading) {
    return <Card><CardContent className="p-6 text-sm text-gray-500">Loading...</CardContent></Card>;
  }

  if (!workspace) {
    return <Card><CardContent className="p-6 text-sm text-red-500">Failed to load workspace settings.</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>General Settings</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
            <Edit3 className="h-4 w-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Workspace Name *</label>
            <Input
              value={workspace.name}
              onChange={(e) => setWorkspace({ ...workspace, name: e.target.value })}
              disabled={!isEditing}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Slug *</label>
            <Input
              value={workspace.slug}
              onChange={(e) => setWorkspace({ ...workspace, slug: e.target.value })}
              disabled={!isEditing}
              className={errors.slug ? 'border-red-500' : ''}
            />
            {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <Textarea
            value={workspace.description || ''}
            onChange={(e) => setWorkspace({ ...workspace, description: e.target.value })}
            disabled={!isEditing}
            placeholder="Describe your workspace..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-1" />
              Email
            </label>
            <Input
              type="email"
              value={workspace.email || ''}
              onChange={(e) => setWorkspace({ ...workspace, email: e.target.value })}
              disabled={!isEditing}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 inline mr-1" />
              Phone
            </label>
            <Input
              value={workspace.phone || ''}
              onChange={(e) => setWorkspace({ ...workspace, phone: e.target.value })}
              disabled={!isEditing}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="h-4 w-4 inline mr-1" />
              Website
            </label>
            <Input
              value={workspace.website || ''}
              onChange={(e) => setWorkspace({ ...workspace, website: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Workspace Type</label>
            <Select
              value={workspace.type}
              onValueChange={(value: string) => setWorkspace({ ...workspace, type: value as Workspace['type'] })}
              placeholder="Select type"
            >
              <SelectItem value="platform">Platform</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="h-4 w-4 inline mr-1" />
            Address
          </label>
          <Textarea
            value={workspace.address || ''}
            onChange={(e) => setWorkspace({ ...workspace, address: e.target.value })}
            disabled={!isEditing}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Palette className="h-4 w-4 inline mr-1" />
              Primary Color
            </label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={workspace.primaryColor || '#007A49'}
                onChange={(e) => setWorkspace({ ...workspace, primaryColor: e.target.value })}
                disabled={!isEditing}
                className="w-16 p-1 h-10"
              />
              <Input
                value={workspace.primaryColor || '#007A49'}
                onChange={(e) => setWorkspace({ ...workspace, primaryColor: e.target.value })}
                disabled={!isEditing}
                placeholder="#007A49"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={workspace.secondaryColor || '#F5F5F5'}
                onChange={(e) => setWorkspace({ ...workspace, secondaryColor: e.target.value })}
                disabled={!isEditing}
                className="w-16 p-1 h-10"
              />
              <Input
                value={workspace.secondaryColor || '#F5F5F5'}
                onChange={(e) => setWorkspace({ ...workspace, secondaryColor: e.target.value })}
                disabled={!isEditing}
                placeholder="#F5F5F5"
              />
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        )}
      </CardContent>

      <ConfirmationModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={confirmSave}
        title="Save Changes"
        description="Are you sure you want to save these changes to your workspace settings?"
        confirmText="Save"
      />
    </Card>
  );
}
