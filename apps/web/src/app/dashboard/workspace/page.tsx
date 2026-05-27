'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useProjectStore from '@shared-core/store/useProjectStore';
import Spinner from '../../../component/Spinner';

export default function WorkspaceIndexPage() {
  const router = useRouter();
  const selectedWorkspce = useProjectStore((state) => state.selectedWorkspce);

  useEffect(() => {
    if (selectedWorkspce?.uid) {
      router.replace(`/dashboard/workspace/${selectedWorkspce.uid}`);
    }
  }, [selectedWorkspce?.uid, router]);

  return (
    <div className="h-full w-full flex items-center justify-center">
      <Spinner />
    </div>
  );
}
