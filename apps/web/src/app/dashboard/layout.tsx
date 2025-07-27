"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useAccessToken } from '@/hooks/useAccessToken';
import DashboardHeaderWeb from '@/component/header/MainHeader';
import { TokenProvider } from '@/context/useTokenContext';
import useProjectStore from '@shared-core/store/useProjectStore';
import NoProjectSelected from '@/component/NoProjectPlaceHolder';
import ErrorLoadingProject from '@/component/ProjectErrorPlaceholder';
import { TestingModeManager } from '@/component/TestingModeManager';
import useHomeStore from '@shared-core/store/useHomeStore';
import Spinner from '../../component/Spinner';
import { useEffect } from 'react';

// Define routes that don't need project selection or header
const STANDALONE_ROUTES = [
  'profile',
  'project',
  'newsite',
  'bulkupload',
  'new-intervention',
  'onboarding'
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, tokenError, tokenLoading, accessToken } = useAccessToken();
  const { selectedProject, loading, error, clearPrjError } = useProjectStore(state => state);
  const orgType = useHomeStore(state => state.orgType);
  const router = useRouter();
  const pathname = usePathname();

  const getCurrentSection = (path: string): string => {
    const section = STANDALONE_ROUTES.find(route => path.includes(`/dashboard/${route}`));
    return section || 'default';
  };

  const currentSection = getCurrentSection(pathname);
  const isStandaloneRoute = currentSection !== 'default';

    useEffect(() => {
    if (!tokenLoading && !user) {
      router.push('/login');
      return;
    }

    const organizationId = localStorage.getItem('orgId');
    if (!organizationId && currentSection !== 'onboarding') {
      router.push('/dashboard/onboarding');
    }
  }, [user, tokenLoading, router, currentSection]);





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

  const renderMainContent = () => {

    if (isStandaloneRoute) {
      return children;
    }

    if (error) {
      return <ErrorLoadingProject onRefresh={handleRefresh} />;
    }

    const projectExists = localStorage.getItem('project')

    if (projectExists && !selectedProject) {
      return <NoProjectSelected handleCreateProject={handleCreateProject} />;
    }

    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <Spinner />
        </div>
      );
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