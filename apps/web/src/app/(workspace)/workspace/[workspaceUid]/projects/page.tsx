'use client'

import { ProjectManagementSection } from '@/app/dashboard/workspace/components/ProjectManagementSection'

export default function WorkspaceProjectsPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <ProjectManagementSection />
      </div>
    </div>
  )
}
