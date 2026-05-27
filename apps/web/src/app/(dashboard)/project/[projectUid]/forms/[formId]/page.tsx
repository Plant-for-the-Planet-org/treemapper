'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FormBuilderProvider } from '@/forms/FormBuilderContext'
import FormBuilder from '@/component/forms/builder/FormBuilder'
import { getFormById, saveForm } from '@/forms/storage'
import { createEmptyForm } from '@/forms/defaults'
import { Form } from '@/forms/types'
import useProjectStore from '@shared-core/store/useProjectStore'
import Spinner from '@/component/Spinner'

export default function FormBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params.formId as string
  const projectUid = params.projectUid as string
  const selectedProject = useProjectStore(state => state.selectedProject)
  const [form, setForm] = useState<Form | null>(null)

  useEffect(() => {
    if (!selectedProject) return

    if (formId === 'new') {
      const newForm = createEmptyForm(selectedProject.uid)
      saveForm(newForm)
      router.replace(`/project/${projectUid}/forms/${newForm.id}`)
      return
    }

    const existing = getFormById(formId)
    if (existing) {
      setForm(existing)
    } else {
      router.push(`/project/${projectUid}/forms`)
    }
  }, [formId, selectedProject, projectUid])

  if (!form) {
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
