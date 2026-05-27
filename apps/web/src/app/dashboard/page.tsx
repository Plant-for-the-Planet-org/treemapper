"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Spinner from '@/component/Spinner';

// Legacy bare /dashboard → new landing at /, preserving the query string so
// invite params (?project-invite=, ?project-link=) still reach the modal.
export default function DashboardRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(qs ? `/?${qs}` : '/');
  }, [searchParams, router]);

  return (
    <div className="h-full w-full flex items-center justify-center">
      <Spinner />
    </div>
  );
}
