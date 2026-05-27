"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useProjectStore from '@shared-core/store/useProjectStore';
import Spinner from '@/component/Spinner';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const { projectUid } = useParams<{ projectUid: string }>();
  const router = useRouter();

  const projects = useProjectStore(state => state.projects);
  const selectedProject = useProjectStore(state => state.selectedProject);
  const selectProject = useProjectStore(state => state.selectProject);
  const workspace = useProjectStore(state => state.workspace);
  const setDefaultWorkspce = useProjectStore(state => state.setDefaultWorkspce);

  const project = projects.find(p => p.uid === projectUid);

  // URL is the source of truth: hydrate the store from the path param.
  useEffect(() => {
    if (project && selectedProject?.uid !== project.uid) {
      selectProject(project);
      const ws = workspace.find(w => w.uid === project.workspace?.uid);
      if (ws) setDefaultWorkspce(ws);
    }
  }, [project, selectedProject, selectProject, workspace, setDefaultWorkspce]);

  // Projects not loaded yet.
  if (projects.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Project id in the URL is not one this user can access.
  if (!project) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="text-lg font-semibold">Project not found</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          This project does not exist or you do not have access to it.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  // Wait for the store to reflect the URL before rendering children.
  if (selectedProject?.uid !== project.uid) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
