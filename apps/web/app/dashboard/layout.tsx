// app/dashboard/layout.tsx
"use client";

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GoogleSpinner from '../../components/Spinner';
import Image from 'next/image';

const TreeMapperLogo = require('../../public/treemapperLogo.png')

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, error, isLoading } = useUser();
  const router = useRouter();

  // Redirect to login if not authenticated

  // Handle logout
  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  if (error) return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;
  
  // This should not happen due to middleware, but just in case
  if (!user) {
    router.push('/login');
    return null;
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <GoogleSpinner />
      </div>
    );
  }

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
          TreeMapper Dashboard</span>
        <div className="app-container">
          <div className="app-content">
            {children}
          </div>
          <span className="text-sm text-gray-500 poweredBy">
            Powered by<Image
              src={'https://cdn.plant-for-the-planet.org/logo/svg/planet.svg'}
              alt="pftp"
              width={20}
              height={20}
              style={{ marginRight: 3, marginLeft:5 }}
            /><span className="font-semibold">Plant-for-the-Planet
            </span>
          </span>
        </div>
      </>
    );
  }