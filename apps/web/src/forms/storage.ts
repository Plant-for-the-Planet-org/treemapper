import { Form } from './types'
import {
  getProjectForms,
  getProjectForm,
  createProjectForm,
  updateProjectForm,
  deleteProjectForm,
} from '@shared-core/fetchApi/api.fetch'

/**
 * Forms data access (the "repository" seam).
 *
 * Backed by the project-scoped forms API on the server. Every function is async
 * and shaped like list / get / create / update / delete. The server returns the
 * exact `Form` shape the app consumes (see apps/server forms.service `toResponse`),
 * so no client-side mapping is needed on the way in; on the way out we send only
 * the editable fields as the create/update DTO.
 *
 * All calls need the auth `token` and the project `uid` (`projectId`), threaded
 * down from the hooks (`useFormsData.ts`) which read them from context/store.
 */

interface ApiResult<T> {
  data?: T
  error?: string | null
  message?: string
  statusCode?: number
}

/** Unwrap the server envelope (`{ data, error, message, statusCode }`) or throw. */
function unwrap<T>(res: ApiResult<T> | null | undefined, fallback: string): T {
  if (!res || res.error || (res.statusCode != null && res.statusCode >= 400) || res.data == null) {
    throw new Error(res?.message || fallback)
  }
  return res.data
}

/** Map a `Form` to the create/update payload (only the server-editable fields). */
function toPayload(form: Form) {
  return {
    name: form.name,
    description: form.description,
    status: form.status,
    siteAssignment: form.siteAssignment,
    siteIds: form.siteIds,
    interventionAssignment: form.interventionAssignment,
    interventionTypes: form.interventionTypes,
    schema: { sections: form.sections },
  }
}

export async function listForms(token: string, projectId: string): Promise<Form[]> {
  const res = await getProjectForms(token, projectId)
  return unwrap<Form[]>(res, 'Could not load forms')
}

export async function getForm(token: string, projectId: string, formId: string): Promise<Form | null> {
  const res = await getProjectForm(token, projectId, formId)
  // A missing or out-of-project form comes back as a 404; treat that as null
  // so callers can show "not found" rather than a hard error.
  if (res?.statusCode === 404) return null
  return unwrap<Form>(res, 'Could not load form')
}

export async function createForm(token: string, projectId: string, form: Form): Promise<Form> {
  const res = await createProjectForm(token, projectId, toPayload(form))
  return unwrap<Form>(res, 'Could not create the form')
}

export async function updateForm(token: string, projectId: string, form: Form): Promise<Form> {
  const res = await updateProjectForm(token, projectId, form.id, toPayload(form))
  return unwrap<Form>(res, 'Could not update the form')
}

export async function deleteForm(token: string, projectId: string, formId: string): Promise<void> {
  const res = await deleteProjectForm(token, projectId, formId)
  unwrap(res, 'Could not delete the form')
}
