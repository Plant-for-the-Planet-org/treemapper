"use client";

import { useRouter, usePathname } from 'next/navigation';
import Spinner from '../../component/Spinner';
import { useEffect, useState } from 'react';
import { useAccessToken } from '@/hooks/useAccessToken';
import DashboardHeaderWeb from '@/component/header/MainHeader';
import { TokenProvider } from '@/context/useTokenContext';
import MigrationModal from '@/component/MigrationModal';
import useProjectStore from '@shared-core/store/useProjectStore'
import NoProjectSelected from '@/component/NoProjectPlaceHolder';
import ErrorLoadingProject from '@/component/ProjectErrorPlaceholder';
import { TestingModeManager } from '@/component/TestingModeManager';



export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, tokenError, tokenLoading, accessToken } = useAccessToken()
  const { selectedProject, loading, error, clearPrjError } = useProjectStore(state => state)

  const router = useRouter();
  const pathname = usePathname();
  const [currentSection, setCurrentSection] = useState<string>('default');
  const [orgLoaded, setOrgLoded] = useState(false)

  const handleRefresh = () => {
    window.location.reload();
    clearPrjError();
  };

  useEffect(() => {
    if (currentSection === 'organization' || currentSection === 'project') {
      setOrgLoded(true)
    }
  }, [currentSection])


  useEffect(() => {
    if (pathname) {
      if (pathname.includes('/profile')) {
        setCurrentSection('profile');
      } else if (pathname.includes('/dashboard/project')) {
        setCurrentSection('project');
      } else if (pathname.includes('/dashboard/newsite')) {
        setCurrentSection('newsite');
      } else if (pathname.includes('/dashboard/new-intervention')) {
        setCurrentSection('new-intervention');
      } else if (pathname.includes('/dashboard/bulkupload')) {
        setCurrentSection('bulkupload');
      } else if (pathname.includes('/dashboard/organization')) {
        setCurrentSection('organization');

      } else {
        setCurrentSection('default');
      }
    }
  }, [pathname]);

  // // Use useEffect for navigation
  useEffect(() => {
    if (!tokenLoading && !user) {
      router.push('/login');
      return
    }

    const organizationId = localStorage.getItem('orgId');
    if (!organizationId) {
      router.push('/dashboard/organization');
    }

  }, [user, tokenLoading, router]);

  const handleCreateProject = () => {
    router.push('/dashboard/project');
  };


  // Handle logout
  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  if (tokenError) {
    handleLogout()
    return <div className="p-8 text-center text-red-500">Error: {String(tokenError)}</div>;
  }

  if (tokenLoading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spinner />
      </div>
    );
  }


  const createNewProject = () => {
    router.push(`/dashboard/project`)

  }
  const openProfileSetting = () => {
    router.push(`/dashboard/profile`)
  }

  const updateRoute = (newRoute: string) => {
    router.push(`/dashboard/${newRoute}`)
  }

  // Conditional rendering based on current section
  const renderSectionSpecificContent = () => {
    switch (currentSection) {
      case 'profile':
        return null
      case 'project':
        return null
      case 'newsite':
        return null
      case 'bulkupload':
        return null
      case 'bulkupload':
        return null
      case 'new-intervention':
        return null
      case 'organization':
        return null
      default:
        return <DashboardHeaderWeb token={accessToken} createNewProject={createNewProject} openProfileSetting={openProfileSetting} updateRoute={updateRoute} />;
    }
  };

  const renderNoPlaceHolderCondition = () => {
    switch (currentSection) {
      case 'profile':
        return children
      case 'project':
        return children
      case 'newsite':
        return children
      case 'bulkupload':
        return children
      case 'organization':
        return children
      default:
        return error ? <ErrorLoadingProject onRefresh={handleRefresh} /> : selectedProject ? children : loading ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Spinner />
        </div> : <NoProjectSelected handleCreateProject={handleCreateProject} />;
    }
  };


  return (
    <>
      <TokenProvider accessToken={accessToken}>
        <div className="app-container">
          <div className="app-content">
            <TestingModeManager devMode={true} />
            {renderSectionSpecificContent()}
            {loading && !orgLoaded ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Spinner />
            </div> : renderNoPlaceHolderCondition()}
          </div>
        </div>
      </TokenProvider>
    </>
  );
}