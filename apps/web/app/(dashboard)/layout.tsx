// app/dashboard/layout.tsx
"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import GoogleSpinner from '../../components/Spinner';

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
        <span className='treemapper-logo'>TreeMapper Dashboard</span>
        <div className="app-container">
          <div className="app-content">
            {children}
          </div>
        </div>
      </>
    );
  }

  // Fallback while redirecting
  return null;
}