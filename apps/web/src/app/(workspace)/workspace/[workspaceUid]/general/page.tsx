'use client'

import { GeneralSettingsSection } from '@/app/dashboard/workspace/components/GeneralSettingsSection'

export default function WorkspaceGeneralPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <GeneralSettingsSection />
      </div>
    </div>
  )
}
