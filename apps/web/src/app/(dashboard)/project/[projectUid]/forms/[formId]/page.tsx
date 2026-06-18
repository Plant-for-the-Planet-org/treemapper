'use client'

import React, { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FormBuilderProvider } from '@/forms/FormBuilderContext'
import FormBuilder from '@/component/forms/builder/FormBuilder'
import { useForm } from '@/forms/useFormsData'
import useProjectStore from '@shared-core/store/useProjectStore'
import Spinner from '@/component/Spinner'

export default function FormBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params.formId as string
  const projectUid = params.projectUid as string
  const selectedProject = useProjectStore(state => state.selectedProject)

  const { form, status } = useForm(formId, selectedProject?.uid ?? '')

  // A missing form (bad id, or one from another project) returns to the list.
  useEffect(() => {
    if (status === 'not-found' || status === 'error') {
      router.replace(`/project/${projectUid}/forms`)
    }
  }, [status, projectUid, router])

  if (!form || status !== 'ready') {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Spinner />
      </div>
    )
  }

  return (
    <FormBuilderProvider form={form}>
      <FormBuilder />
    </FormBuilderProvider>
  )
}
