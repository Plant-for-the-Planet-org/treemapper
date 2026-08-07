'use client'

import { SpeciesRequestsSection } from '@/app/dashboard/workspace/components/SpeciesRequestsSection'

export default function WorkspaceSpeciesPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-full mx-auto">
        <SpeciesRequestsSection />
      </div>
    </div>
  )
}
