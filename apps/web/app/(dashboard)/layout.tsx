// app/dashboard/layout.tsx
"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import GoogleSpinner from '../../components/Spinner';
import Image from 'next/image';

const TreeMapperLogo = require('../../public/treemapperLogo.png')

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <GoogleSpinner />
      </div>
    );
  }

  // Only render protected content if authenticated
  if (status === 'authenticated') {
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

  // Fallback while redirecting
  return null;
}