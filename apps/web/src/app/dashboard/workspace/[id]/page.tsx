'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Spinner from '../../../../component/Spinner';

// Workspace section moved to /workspace/:workspaceUid.
export default function WorkspaceByIdRedirect() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  useEffect(() => {
    if (id) router.replace(`/workspace/${id}`);
  }, [id, router]);

  return (
    <div className="h-full w-full flex items-center justify-center">
      <Spinner />
    </div>
  );
}
