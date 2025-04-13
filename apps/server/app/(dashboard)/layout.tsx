"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import GoogleSpinner from '../../components/Spinner';

// Protected layout for dashboard and other authenticated pages
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to login if not authenticated
  useEffect(() => {
    // This is a safety check in case the middleware doesn't catch the redirection
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status == 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <GoogleSpinner />
      </div>
    );
  }

  // Only render protected content if authenticated
  if (status === 'authenticated') {
    return children;
  }

  // Fallback while redirecting
  return null;
}