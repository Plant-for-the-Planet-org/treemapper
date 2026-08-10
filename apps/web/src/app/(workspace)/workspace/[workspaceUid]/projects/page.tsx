'use client'

import { ProjectManagementSection } from '@/app/dashboard/workspace/components/ProjectManagementSection'

export default function WorkspaceProjectsPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-full">
        <div className="mb-6">
          <h2 className="mb-1 text-2xl font-bold text-gray-900">Projects</h2>
          <p className="text-sm text-gray-500">
            Review, manage, and transfer every project in this workspace.
          </p>
        </div>
        <ProjectManagementSection />
      </div>
    </div>
  )
}
