'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckSquare, FolderOpen, Save } from 'lucide-react';
import {
  getWorkspaceSettings,
  updateWorkspaceSettings,
  getWorkspaceProjectsApi,
} from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import { useUserStore } from '@shared-core/store/useUserStore';
import type { WorkspaceSettings } from '../types';
import { DEFAULT_WORKSPACE_SETTINGS } from '../types';
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
} from './workspace-ui';

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#007A49] focus:ring-offset-2 ${
        checked ? 'bg-[#007A49]' : 'bg-gray-200'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <div className="flex-1 pr-6">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {description && <div className="mt-0.5 text-sm text-gray-500">{description}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="mb-1 flex items-center gap-2 pb-2">
      <Icon className="h-4 w-4 text-[#007A49]" />
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
    </div>
  );
}

export function GeneralSettingsSection() {
  const { accessToken } = useToken();
  const currentUser = useUserStore((state) => state.user);
  const [settings, setSettings] = useState<WorkspaceSettings>(DEFAULT_WORKSPACE_SETTINGS);
  const [projects, setProjects] = useState<{ uid: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  useEffect(() => {
    if (!accessToken || !currentUser?.primaryWorkspaceUid) return;
    const uid = currentUser.primaryWorkspaceUid;
    setIsLoading(true);
    Promise.all([
      getWorkspaceSettings(accessToken, uid),
      getWorkspaceProjectsApi(accessToken, uid),
    ])
      .then(([settingsRes, projectsRes]) => {
        if (settingsRes?.data && !settingsRes.error) {
          setSettings({ ...DEFAULT_WORKSPACE_SETTINGS, ...settingsRes.data });
        }
        if (Array.isArray(projectsRes)) {
          setProjects(projectsRes.map((p: { uid: string; name: string }) => ({ uid: p.uid, name: p.name })));
        }
      })
      .finally(() => setIsLoading(false));
  }, [accessToken, currentUser?.primaryWorkspaceUid]);

  const patch = (update: Partial<WorkspaceSettings>) =>
    setSettings((prev) => ({ ...prev, ...update }));

  const patchNotifications = (update: Partial<WorkspaceSettings['notifications']>) =>
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, ...update },
    }));

  const toggleWhitelistProject = (uid: string) => {
    const current = settings.notifications.interventionProjectWhitelist;
    const next = current.includes(uid)
      ? current.filter((u) => u !== uid)
      : [...current, uid];
    patchNotifications({ interventionProjectWhitelist: next });
  };

  const confirmSave = async () => {
    if (!currentUser?.primaryWorkspaceUid) return;
    setIsSaving(true);
    const result = await updateWorkspaceSettings(
      accessToken,
      currentUser.primaryWorkspaceUid,
      settings,
    );
    setIsSaving(false);
    setShowSaveModal(false);
    if (result && !result.error) {
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-gray-500">Loading settings...</CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <p className="mt-1 text-sm text-gray-500">
            Configure defaults and behavior for all projects and members in this workspace.
          </p>
        </CardHeader>

        <CardContent className="divide-y divide-gray-100">
          {/* ── Approval Board ─────────────────────────── */}
          <div className="pb-5">
            <SectionHeader icon={CheckSquare} title="Approval Board" />
            <SettingRow
              label="Auto-enable approval board"
              description="Every new project created in this workspace will have the approval board enabled by default."
            >
              <Toggle
                checked={settings.approvalBoardEnabled}
                onChange={(v) => patch({ approvalBoardEnabled: v })}
              />
            </SettingRow>
          </div>

          {/* ── Project Defaults ───────────────────────── */}
          <div className="py-5">
            <SectionHeader icon={FolderOpen} title="Project Defaults" />

            <SettingRow
              label="Default project visibility"
              description="New projects will be created with this visibility unless overridden."
            >
              <Select
                value={settings.defaultProjectVisibility}
                onValueChange={(v) =>
                  patch({ defaultProjectVisibility: v as 'public' | 'private' })
                }
                placeholder="Select"
              >
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </Select>
            </SettingRow>

            <SettingRow
              label="Allow member invites"
              description="Non-admin members can invite other people to join this workspace."
            >
              <Toggle
                checked={settings.allowMemberInvites}
                onChange={(v) => patch({ allowMemberInvites: v })}
              />
            </SettingRow>

            <SettingRow
              label="Require admin approval for new projects"
              description="New projects must be approved by an admin before they go live."
            >
              <Toggle
                checked={settings.requireApprovalForNewProjects}
                onChange={(v) => patch({ requireApprovalForNewProjects: v })}
              />
            </SettingRow>

            <SettingRow
              label="Maximum projects"
              description="Cap the total number of projects in this workspace. Leave empty for unlimited."
            >
              <Input
                type="number"
                min={1}
                value={settings.maxProjects ?? ''}
                onChange={(e) =>
                  patch({
                    maxProjects: e.target.value === '' ? null : parseInt(e.target.value, 10),
                  })
                }
                placeholder="Unlimited"
                className="w-28 text-right"
              />
            </SettingRow>
          </div>

          {/* ── Email Notifications ────────────────────── */}
          <div className="pt-5">
            <SectionHeader icon={Bell} title="Email Notifications" />
            <p className="mb-1 text-sm text-gray-500">
              Send emails to workspace admins when…
            </p>

            <SettingRow
              label="A project is created"
              description="Notifies admins each time a new project is added to this workspace."
            >
              <Toggle
                checked={settings.notifications.onProjectCreate}
                onChange={(v) => patchNotifications({ onProjectCreate: v })}
              />
            </SettingRow>

            <SettingRow
              label="An intervention is created"
              description="Notifies admins when a field worker submits a new intervention."
            >
              <Toggle
                checked={settings.notifications.onInterventionCreate}
                onChange={(v) => patchNotifications({ onInterventionCreate: v })}
              />
            </SettingRow>

            {settings.notifications.onInterventionCreate && projects.length > 0 && (
              <div className="mb-3 ml-4 border-l-2 border-gray-200 pl-4">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Filter to specific projects{' '}
                  <span className="font-normal text-gray-400">(empty = all projects)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {projects.map((p) => {
                    const selected =
                      settings.notifications.interventionProjectWhitelist.includes(p.uid);
                    return (
                      <button
                        key={p.uid}
                        type="button"
                        onClick={() => toggleWhitelistProject(p.uid)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          selected
                            ? 'border-[#007A49] bg-[#007A49] text-white'
                            : 'border-gray-300 bg-white text-gray-600 hover:border-[#007A49] hover:text-[#007A49]'
                        }`}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <SettingRow
              label="Profile activity"
              description="Site creation, profile updates, and other workspace-level activity."
            >
              <Toggle
                checked={settings.notifications.onProfileActivity}
                onChange={(v) => patchNotifications({ onProfileActivity: v })}
              />
            </SettingRow>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-end gap-3">
        {savedOk && (
          <span className="text-sm font-medium text-[#007A49]">Settings saved.</span>
        )}
        <Button onClick={() => setShowSaveModal(true)} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>

      <ConfirmationModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={confirmSave}
        title="Save Workspace Settings"
        description="Are you sure you want to save these settings? They will apply to all new projects and members in this workspace."
        confirmText="Save"
      />
    </>
  );
}
