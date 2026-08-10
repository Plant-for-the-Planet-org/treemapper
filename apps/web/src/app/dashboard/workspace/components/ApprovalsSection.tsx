'use client';

import React from 'react';
import { ApprovalBoard } from '@/app/(dashboard)/project/[projectUid]/approvals/component/ApprovalBoard';
import useProjectStore from '@shared-core/store/useProjectStore';

// Workspace-wide approvals: the same board used inside a project, scoped to
// every project in the selected workspace.
export function ApprovalsSection() {
  const { selectedWorkspce: selectedWorkspace } = useProjectStore((state) => state);

  if (!selectedWorkspace) {
    return <div className="p-6 text-gray-500 text-sm">No workspace selected.</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Approvals</h2>
        <p className="text-sm text-gray-500">
          All interventions and sites awaiting review across every project in{' '}
          {selectedWorkspace.name}.
        </p>
      </div>

      <ApprovalBoard scope={{ kind: 'workspace', workspaceUid: selectedWorkspace.uid }} />
    </div>
  );
}
