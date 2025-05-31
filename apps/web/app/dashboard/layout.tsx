// app/dashboard/layout.tsx
"use client";

import { useRouter, usePathname } from 'next/navigation';
// import Link from 'next/link';
import GoogleSpinner from '../../components/Spinner';
// import Image from 'next/image';
import { useEffect, useState } from 'react';
import DashboardHeader from 'dashboard/pages/dashboardHeader/DashboardHeader';
import { useAccessToken } from '../../hooks/useAccessToken';
import { TokenProvider } from 'dashboard/context/TokenContext';
import MigrationModal from '../../components/MigrationModal';
import useProjectStore from 'dashboard/store/useProjectStore'
import NoProjectSelected from '../../components/NoProjectPlaceHolde';
import ErrorLoadingProject from '../../components/ProjectErrorPlaceholder';


// const TreeMapperLogo = require('../../public/treemapperLogo.png')

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, tokenError, tokenLoading, accessToken } = useAccessToken()
  const { selectedProject, loading , error, clearPrjError} = useProjectStore(state => state)
  // const accessToken = process.env.NEXT_PUBLIC_TEST_TOKEN || '';

  const router = useRouter();
  const pathname = usePathname(); // Get the current pathname
  // State to track which content to render based on current route
  const [currentSection, setCurrentSection] = useState<string>('default');

  const handleRefresh = () => {
  window.location.reload();
  clearPrjError();
};

  // Listen for URL changes and update the section state
  useEffect(() => {
    if (pathname) {
      if (pathname.includes('/profile')) {
        setCurrentSection('profile');
      } else if (pathname.includes('/dashboard/project')) {
        setCurrentSection('project');
      } else {
        setCurrentSection('default');
      }
    }
  }, [pathname]);

  // Use useEffect for navigation
  useEffect(() => {
    if (!tokenLoading && !user) {
      router.push('/login');
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

  // Show loading state while checking authentication
  if (tokenLoading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <GoogleSpinner />
      </div>
    );
  }

  // Conditional rendering based on current section
  const renderSectionSpecificContent = () => {
    switch (currentSection) {
      case 'profile':
        return null
      case 'project':
        return null
      default:
        return <DashboardHeader token={accessToken || ''} />;
    }
  };

  const renderNoPlaceHolderCondition = () => {
    switch (currentSection) {
      case 'profile':
        return children
      case 'project':
        return children
      default:
        return error?<ErrorLoadingProject onRefresh={handleRefresh}/>:selectedProject ? children : <NoProjectSelected handleCreateProject={handleCreateProject} />;
    }
  };


  return (
    <>
      <TokenProvider accessToken={accessToken}>
        <div className="app-container">
          <MigrationModal />
          {/* Display section-specific content if any */}
          <div className="app-content">
            {renderSectionSpecificContent()}
            {loading ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <GoogleSpinner />
            </div> : renderNoPlaceHolderCondition()}
          </div>
        </div>
      </TokenProvider>
    </>
  );
}