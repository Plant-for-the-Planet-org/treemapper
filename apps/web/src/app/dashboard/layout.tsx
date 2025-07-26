"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAccessToken } from '@/hooks/useAccessToken';
import DashboardHeaderWeb from '@/component/header/MainHeader';
import { TokenProvider } from '@/context/useTokenContext';
import useProjectStore from '@shared-core/store/useProjectStore';
import NoProjectSelected from '@/component/NoProjectPlaceHolder';
import ErrorLoadingProject from '@/component/ProjectErrorPlaceholder';
import { TestingModeManager } from '@/component/TestingModeManager';
import useHomeStore from '@shared-core/store/useHomeStore';
import Spinner from '../../component/Spinner';

// Define routes that don't need project selection or header
const STANDALONE_ROUTES = [
  'profile',
  'project', 
  'newsite',
  'bulkupload',
  'new-intervention',
  'organization',
  'onboarding'
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, tokenError, tokenLoading, accessToken } = useAccessToken();
  const { selectedProject, loading, error, clearPrjError } = useProjectStore(state => state);
  const orgType = useHomeStore(state => state.orgType);
  const router = useRouter();
  const pathname = usePathname();

  // Get current section from pathname
  const getCurrentSection = (path: string): string => {
    const section = STANDALONE_ROUTES.find(route => path.includes(`/dashboard/${route}`));
    return section || 'default';
  };

  const currentSection = getCurrentSection(pathname);
  const isStandaloneRoute = currentSection !== 'default';

  // Handle authentication and organization redirect
  useEffect(() => {
    if (!tokenLoading && !user) {
      router.push('/login');
      return;
    }

    const organizationId = localStorage.getItem('orgId');
    if (!organizationId && currentSection !== 'organization') {
      router.push('/dashboard/organization');
    }
  }, [user, tokenLoading, router, currentSection]);

  // Check if organization is selected
  const organizationId = localStorage.getItem('orgId');
  const hasOrganization = !!organizationId;

  // Navigation handlers
  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  const handleRefresh = () => {
    window.location.reload();
    clearPrjError();
  };

  const handleCreateProject = () => {
    router.push('/dashboard/project');
  };

  const navigationHandlers = {
    createNewProject: () => router.push('/dashboard/project'),
    openProfileSetting: () => router.push('/dashboard/profile'),
    updateRoute: (newRoute: string) => router.push(`/dashboard/${newRoute}`)
  };

  // Loading and error states
  if (tokenError) {
    handleLogout();
    return <div className="p-8 text-center text-red-500">Error: {String(tokenError)}</div>;
  }

  if (tokenLoading || !user) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  // Main content rendering
  const renderMainContent = () => {
    // Always allow organization route to render
    if (currentSection === 'organization') {
      return children;
    }

    // If no organization selected, redirect (don't render children to prevent API calls)
    if (!hasOrganization) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Please select an organization to continue</p>
            <Spinner />
          </div>
        </div>
      );
    }

    // For standalone routes (except organization), show children
    if (isStandaloneRoute) {
      return children;
    }

    // For default route, handle project selection logic
    if (error) {
      return <ErrorLoadingProject onRefresh={handleRefresh} />;
    }

    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <Spinner />
        </div>
      );
    }

    if (!selectedProject) {
      return <NoProjectSelected handleCreateProject={handleCreateProject} />;
    }

    return children;
  };

  return (
    <TokenProvider accessToken={accessToken}>
      <div className='parent'>
      <div className="app-container">
        <div className="app-content">
          <TestingModeManager devMode={orgType === 'dev'} />
          
          {/* Only show header for default route */}
          {!isStandaloneRoute && (
            <DashboardHeaderWeb 
              token={accessToken} 
              {...navigationHandlers}
            />
          )}
          
          {renderMainContent()}
        </div>
      </div>
      </div>
    </TokenProvider>
  );
}