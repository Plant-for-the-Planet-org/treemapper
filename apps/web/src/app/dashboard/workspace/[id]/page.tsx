'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useToken } from '@/context/useTokenContext';
import useProjectStore from '@shared-core/store/useProjectStore';
import { getWorkspace } from '@shared-core/fetchApi/api.fetch';
import Spinner from '../../../../component/Spinner';
import WorkspaceSettings from '../WorkspaceSettings';

export default function WorkspaceByIdPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const { accessToken } = useToken();
  const { selectedWorkspce, workspace, setDefaultWorkspce } = useProjectStore((state) => state);
  const [ready, setReady] = useState(selectedWorkspce?.uid === id);

  useEffect(() => {
    if (!id || selectedWorkspce?.uid === id) {
      setReady(true);
      return;
    }

    // Prefer the workspace already loaded in the user's list (has role + type).
    const fromList = workspace.find((w) => w.uid === id);
    if (fromList) {
      setDefaultWorkspce(fromList);
      setReady(true);
      return;
    }

    // Otherwise load it directly (e.g. an admin opening a workspace outside their list).
    if (!accessToken) return;
    let cancelled = false;
    getWorkspace(accessToken, id).then((res) => {
      if (cancelled) return;
      // getWorkspace returns the raw workspace row (no { statusCode, data } envelope).
      if (res?.uid) {
        setDefaultWorkspce({
          uid: res.uid,
          name: res.name ?? '',
          type: res.type ?? '',
          userRole: 'owner',
        } as any);
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id, accessToken, selectedWorkspce?.uid, workspace, setDefaultWorkspce]);

  if (!ready) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <WorkspaceSettings />;
}
