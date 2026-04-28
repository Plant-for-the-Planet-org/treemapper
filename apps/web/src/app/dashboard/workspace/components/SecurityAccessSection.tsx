'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmationModal,
  Select,
  SelectItem
} from './workspace-ui';

export function SecurityAccessSection() {
  const [settings, setSettings] = useState({
    workspacePrivate: false,
    requireInviteApproval: true,
    allowMemberInvites: false,
    defaultProjectVisibility: 'private',
    sessionTimeout: '24',
    twoFactorRequired: false
  });
  const [showSaveModal, setShowSaveModal] = useState(false);

  const handleSave = () => {
    setShowSaveModal(true);
  };

  const confirmSave = () => {
    console.log('Saving security settings:', settings);
    setShowSaveModal(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security & Access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Private Workspace</h4>
              <p className="text-sm text-gray-600">Make workspace invite-only</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-gray-300 rounded"
              checked={settings.workspacePrivate}
              onChange={(e) => setSettings({ ...settings, workspacePrivate: e.target.checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Require Invite Approval</h4>
              <p className="text-sm text-gray-600">Admin approval required for new invites</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-gray-300 rounded"
              checked={settings.requireInviteApproval}
              onChange={(e) => setSettings({ ...settings, requireInviteApproval: e.target.checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Allow Member Invites</h4>
              <p className="text-sm text-gray-600">Let members invite others to workspace</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-gray-300 rounded"
              checked={settings.allowMemberInvites}
              onChange={(e) => setSettings({ ...settings, allowMemberInvites: e.target.checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Two-Factor Authentication Required</h4>
              <p className="text-sm text-gray-600">Require 2FA for all workspace members</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-gray-300 rounded"
              checked={settings.twoFactorRequired}
              onChange={(e) => setSettings({ ...settings, twoFactorRequired: e.target.checked })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Project Visibility</label>
            <Select
              value={settings.defaultProjectVisibility}
              onValueChange={(value) => setSettings({ ...settings, defaultProjectVisibility: value })}
            >
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (hours)</label>
            <Select
              value={settings.sessionTimeout}
              onValueChange={(value) => setSettings({ ...settings, sessionTimeout: value })}
            >
              <SelectItem value="1">1 hour</SelectItem>
              <SelectItem value="8">8 hours</SelectItem>
              <SelectItem value="24">24 hours</SelectItem>
              <SelectItem value="168">1 week</SelectItem>
            </Select>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Security Settings
          </Button>
        </div>
      </CardContent>

      <ConfirmationModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={confirmSave}
        title="Save Security Settings"
        description="Are you sure you want to update these security settings? This may affect all workspace members."
        confirmText="Save"
      />
    </Card>
  );
}
