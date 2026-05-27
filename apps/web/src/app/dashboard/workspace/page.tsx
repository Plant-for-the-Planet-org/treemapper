"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Spinner from '../../../component/Spinner';

// Workspace section moved to /workspace.
export default function WorkspaceIndexRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/workspace');
  }, [router]);
  return (
    <div className="h-full w-full flex items-center justify-center">
      <Spinner />
    </div>
  );
}
