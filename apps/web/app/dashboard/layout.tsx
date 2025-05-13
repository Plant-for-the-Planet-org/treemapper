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


// const TreeMapperLogo = require('../../public/treemapperLogo.png')

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken, user, tokenError, tokenLoading } = useAccessToken()
  const router = useRouter();
  const pathname = usePathname(); // Get the current pathname

  // State to track which content to render based on current route
  const [currentSection, setCurrentSection] = useState<string>('default');

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



  // Handle logout
  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  if (tokenError) return <div className="p-8 text-center text-red-500">Error: {String(tokenError)}</div>;

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

  return (
    <>
      <TokenProvider accessToken={accessToken}>
        <div className="app-container">
          {/* Display section-specific content if any */}
          <div className="app-content">
            {renderSectionSpecificContent()}
            {children}
          </div>
        </div>
      </TokenProvider>
    </>
  );
}