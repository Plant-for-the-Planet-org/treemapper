"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useProjectStore from '@shared-core/store/useProjectStore';
import Spinner from '@/component/Spinner';

// Transitional redirect: settings now lives at /project/:projectUid/settings.
// Removed once all callers link to the id-based URL.
export default function SettingsRedirect() {
  const router = useRouter();
  const selectedProject = useProjectStore(state => state.selectedProject);

  useEffect(() => {
    const uid = selectedProject?.uid
      ?? (typeof window !== 'undefined' ? localStorage.getItem('project') : null);
    if (uid) {
      router.replace(`/project/${uid}/settings`);
    }
  }, [selectedProject, router]);

  return (
    <div className="h-full w-full flex items-center justify-center">
      <Spinner />
    </div>
  );
}
