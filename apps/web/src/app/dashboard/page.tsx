"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useProjectStore from '@shared-core/store/useProjectStore';
import { useUserStore } from '@shared-core/store/useUserStore';
import Spinner from '@/component/Spinner';

// Bare /dashboard landing redirects to the active project's overview, falling
// back to the user's primary project once bootstrap has loaded.
export default function DashboardRedirect() {
  const router = useRouter();
  const selectedProject = useProjectStore(state => state.selectedProject);
  const primaryProjectUid = useUserStore(state => state.user?.primaryProjectUid);

  useEffect(() => {
    const uid = selectedProject?.uid ?? primaryProjectUid;
    if (uid) {
      router.replace(`/project/${uid}/overview`);
    }
  }, [selectedProject, primaryProjectUid, router]);

  return (
    <div className="h-full w-full flex items-center justify-center">
      <Spinner />
    </div>
  );
}
