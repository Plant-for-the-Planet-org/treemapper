'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, ConfirmationModal } from './workspace-ui';

export function NotificationsCommunicationSection() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    projectUpdates: true,
    memberActivity: false,
    systemAnnouncements: true,
    weeklyDigest: true,
    instantNotifications: false
  });
  const [showSaveModal, setShowSaveModal] = useState(false);

  const handleSave = () => {
    setShowSaveModal(true);
  };

  const confirmSave = () => {
    console.log('Saving notification settings:', settings);
    setShowSaveModal(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications & Communication</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Email Notifications</h4>
              <p className="text-sm text-gray-600">Receive notifications via email</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-gray-300 rounded"
              checked={settings.emailNotifications}
              onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Project Updates</h4>
              <p className="text-sm text-gray-600">Get notified about project changes</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-gray-300 rounded"
              checked={settings.projectUpdates}
              onChange={(e) => setSettings({ ...settings, projectUpdates: e.target.checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Member Activity</h4>
              <p className="text-sm text-gray-600">Notifications when members join/leave</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-gray-300 rounded"
              checked={settings.memberActivity}
              onChange={(e) => setSettings({ ...settings, memberActivity: e.target.checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">System Announcements</h4>
              <p className="text-sm text-gray-600">Important platform updates</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-gray-300 rounded"
              checked={settings.systemAnnouncements}
              onChange={(e) => setSettings({ ...settings, systemAnnouncements: e.target.checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Weekly Digest</h4>
              <p className="text-sm text-gray-600">Weekly summary of workspace activity</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-gray-300 rounded"
              checked={settings.weeklyDigest}
              onChange={(e) => setSettings({ ...settings, weeklyDigest: e.target.checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Instant Notifications</h4>
              <p className="text-sm text-gray-600">Real-time browser notifications</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-gray-300 rounded"
              checked={settings.instantNotifications}
              onChange={(e) => setSettings({ ...settings, instantNotifications: e.target.checked })}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Notification Settings
          </Button>
        </div>
      </CardContent>

      <ConfirmationModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={confirmSave}
        title="Save Notification Settings"
        description="Are you sure you want to update these notification preferences?"
        confirmText="Save"
      />
    </Card>
  );
}
