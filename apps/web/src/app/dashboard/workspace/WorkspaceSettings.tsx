'use client';

import { useState } from 'react';
import {
  Activity,
  FolderOpen,
  Settings,
  UserCheck,
  Users
} from 'lucide-react';
import { useToken } from '@/context/useTokenContext';
import { useUserStore } from '@shared-core/store/useUserStore';
import { ActivityAuditSection } from './components/ActivityAuditSection';
import { GeneralSettingsSection } from './components/GeneralSettingsSection';
import { ImpersonationSection } from './components/ImpersonationSection';
import { MemberManagementSection } from './components/MemberManagementSection';
import { ProjectManagementSection } from './components/ProjectManagementSection';
import { Avatar } from './components/workspace-ui';
import { mockWorkspace } from './mocks';

export default function WorkspaceSettings() {
  const [activeSection, setActiveSection] = useState('general');
  const { accessToken } = useToken();
  const currentUser = useUserStore((state) => state.user);

  const sections = [
    // { id: 'general', label: 'General Settings', icon: Settings },
    { id: 'members', label: 'Member Management', icon: Users },
    { id: 'projects', label: 'Project Management', icon: FolderOpen },
    { id: 'activity', label: 'Activity & Audit', icon: Activity },
    { id: 'impersonation', label: 'Impersonation', icon: UserCheck }
  ];

  const goHome = () => {
    window.location.replace('/');
    window.location.reload();
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      // case 'general':
      //   return <GeneralSettingsSection />;
      case 'members':
        return <MemberManagementSection />;
      case 'projects':
        return <ProjectManagementSection />;
      case 'activity':
        return <ActivityAuditSection />;
      case 'impersonation':
        return <ImpersonationSection token={accessToken} goHome={goHome} />;
      default:
        return <MemberManagementSection />;
    }
  };

  return (
    <div className="bg-gray-50">
      <div className="flex">
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen relative">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">Workspace Settings</h1>
            <p className="text-sm text-gray-600 mt-1">{mockWorkspace.name}</p>
          </div>

          <nav className="p-4">
            <ul className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-[#007A49] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {section.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 w-64 p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <Avatar
                src={currentUser.image}
                alt={currentUser.displayName}
                fallback={currentUser.displayName.split(' ').map((n) => n[0]).join('')}
                className="h-8 w-8"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 truncate">{currentUser.displayName}</div>
                <div className="text-xs text-gray-500">Workspace Admin</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">{renderActiveSection()}</div>
        </div>
      </div>
    </div>
  );
}
