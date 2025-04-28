// app/dashboard/layout.tsx
"use client";

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import GoogleSpinner from '../../components/Spinner';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import DashboardHeader from 'dashboard/pages/dashboardHeader/DashboardHeader';

const TreeMapperLogo = require('../../public/treemapperLogo.png')

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, error, isLoading } = useUser();
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
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Handle logout
  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  if (error) return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;

  // Show loading state while checking authentication
  if (isLoading || !user) {
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
      default:
        return <DashboardHeader />;
    }
  };

  return (
    <>
      <span className='treemapper-logo'>
        <Image
          src={TreeMapperLogo}
          alt="Logo"
          width={40}
          height={35}
          style={{ marginBottom: 5 }}
        />
        TreeMapper Dashboard
      </span>
      <div className="app-container">
        {/* Display section-specific content if any */}
        <div className="app-content">
          {renderSectionSpecificContent()}
          {children}
        </div>
        <span className="text-sm text-gray-500 poweredBy">
          Powered by<Image
            src={'https://cdn.plant-for-the-planet.org/logo/svg/planet.svg'}
            alt="pftp"
            width={20}
            height={20}
            style={{ marginRight: 3, marginLeft: 5 }}
          /><span className="font-semibold">Plant-for-the-Planet
          </span>
        </span>
      </div>
    </>
  );
}