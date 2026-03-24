'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ChevronDown,
  FolderOpen,
  Settings,
  UserCheck,
  Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToken } from '@/context/useTokenContext';
import { useUserStore } from '@shared-core/store/useUserStore';
import useProjectStore from '@shared-core/store/useProjectStore';
import { getMyAdminWorkspaces } from '@shared-core/fetchApi/api.fetch';
import { ActivityAuditSection } from './components/ActivityAuditSection';
import { GeneralSettingsSection } from './components/GeneralSettingsSection';
import { ImpersonationSection } from './components/ImpersonationSection';
import { MemberManagementSection } from './components/MemberManagementSection';
import { ProjectManagementSection } from './components/ProjectManagementSection';
import { Avatar } from './components/workspace-ui';

export default function WorkspaceSettings() {
  const [activeSection, setActiveSection] = useState('general');
  const { accessToken } = useToken();
  const currentUser = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);
  const { selectedWorkspce: selectedWorkspace, setDefaultWorkspce } = useProjectStore((state) => state);
  const router = useRouter();
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [adminWorkspaces, setAdminWorkspaces] = useState<{ uid: string; name: string; slug: string; role: string }[]>([]);

  useEffect(() => {
    getMyAdminWorkspaces(accessToken).then((res) => {
      if (Array.isArray(res?.data)) setAdminWorkspaces(res.data);
    });
  }, [accessToken]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setWsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchableWorkspaces = adminWorkspaces.filter((w) => w.uid !== selectedWorkspace?.uid);

  const sections = [
    { id: 'general', label: 'General Settings', icon: Settings },
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
      case 'general':
        return <GeneralSettingsSection />;
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
    <div className="bg-gray-50 h-full flex overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-full relative">
          <div className="p-6 border-b border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/dashboard/overview')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Workspace Settings</h1>
            <div className="relative mt-1" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setWsDropdownOpen((o) => !o)}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors w-full"
                disabled={switchableWorkspaces.length === 0}
              >
                <span className="truncate">{selectedWorkspace?.name}</span>
                {switchableWorkspaces.length > 0 && (
                  <ChevronDown className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${wsDropdownOpen ? 'rotate-180' : ''}`} />
                )}
              </button>
              {wsDropdownOpen && switchableWorkspaces.length > 0 && (
                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                  {switchableWorkspaces.map((ws) => (
                    <button
                      key={ws.uid}
                      type="button"
                      onClick={() => {
                        setDefaultWorkspce(ws);
                        updateUser({ primaryWorkspaceUid: ws.uid });
                        setWsDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 truncate"
                    >
                      {ws.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 p-4">
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

          <div className="p-4 border-t border-gray-200 bg-white mt-auto">
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
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">{renderActiveSection()}</div>
        </div>
      </div>
    </div>
  );
}
