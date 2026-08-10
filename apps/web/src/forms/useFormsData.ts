'use client'

import { useCallback, useEffect, useState } from 'react'
import { Form } from './types'
import { createEmptyForm } from './defaults'
import { useToken } from '@/context/useTokenContext'
import * as repo from './storage'

/**
 * Thin data hooks over the forms repository (`storage.ts`). Components depend on
 * these, not on the storage functions directly. The hooks read the auth token
 * from context and pass it (with the project uid) to the repository, which calls
 * the project-scoped forms API. Loading / error state is exposed because the
 * repository is async.
 */

export function useForms(projectId: string) {
  const { accessToken } = useToken()
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!projectId || !accessToken) return
    setLoading(true)
    setError(null)
    try {
      setForms(await repo.listForms(accessToken, projectId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load forms')
    } finally {
      setLoading(false)
    }
  }, [projectId, accessToken])

  useEffect(() => { void refetch() }, [refetch])

  return { forms, loading, error, refetch }
}

export type FormLoadStatus = 'loading' | 'ready' | 'not-found' | 'error'

/**
 * Load a single form for editing. `formId === 'new'` yields a fresh in-memory
 * form that is not persisted until the first save (no orphan drafts). Existing
 * forms are fetched from the API, which is already project-scoped (a form from
 * another project comes back as not-found).
 */
export function useForm(formId: string, projectId: string) {
  const { accessToken } = useToken()
  const [form, setForm] = useState<Form | null>(null)
  const [status, setStatus] = useState<FormLoadStatus>('loading')

  useEffect(() => {
    if (!projectId) return

    if (formId === 'new') {
      setForm(createEmptyForm(projectId))
      setStatus('ready')
      return
    }

    if (!accessToken) return
    let cancelled = false

    setStatus('loading')
    repo.getForm(accessToken, projectId, formId)
      .then(found => {
        if (cancelled) return
        if (found) {
          setForm(found)
          setStatus('ready')
        } else {
          setForm(null)
          setStatus('not-found')
        }
      })
      .catch(() => { if (!cancelled) setStatus('error') })

    return () => { cancelled = true }
  }, [formId, projectId, accessToken])

  return { form, status, isNew: formId === 'new' }
}
