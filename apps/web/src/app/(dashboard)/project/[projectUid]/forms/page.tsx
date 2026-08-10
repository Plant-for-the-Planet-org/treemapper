'use client'

import React from 'react'
import FormsList from '@/component/forms/FormsList'
import useProjectStore from '@shared-core/store/useProjectStore'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

export default function FormsPage() {
  const selectedProject = useProjectStore(state => state.selectedProject)

  if (!selectedProject) {
    return (
      <div className="p-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>Please select a project to manage forms.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return <FormsList projectId={selectedProject.uid} projectName={selectedProject.name} />
}
