"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useProjectStore from '@shared-core/store/useProjectStore';
import { useUserStore } from '@shared-core/store/useUserStore';
import Spinner from '@/component/Spinner';

// Transitional redirect for project-scoped pages that have moved to
// /project/:projectUid/<subpath>. Swaps the legacy /dashboard prefix for the
// id-based path, preserving any nested segments (e.g. forms/:formId).
// Removed once all callers link to the id-based URLs.
export default function LegacyProjectRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const selectedProject = useProjectStore(state => state.selectedProject);
  const primaryProjectUid = useUserStore(state => state.user?.primaryProjectUid);

  useEffect(() => {
    const uid = selectedProject?.uid ?? primaryProjectUid;
    if (uid) {
      router.replace(pathname.replace(/^\/dashboard/, `/project/${uid}`));
    }
  }, [selectedProject, primaryProjectUid, pathname, router]);

  return (
    <div className="h-full w-full flex items-center justify-center">
      <Spinner />
    </div>
  );
}
