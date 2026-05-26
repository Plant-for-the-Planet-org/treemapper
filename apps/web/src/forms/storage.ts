import { Form } from './types'

const FORMS_KEY = 'treemapper_forms'

export function getAllForms(): Form[] {
  try {
    const raw = localStorage.getItem(FORMS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getFormsByProject(projectId: string): Form[] {
  return getAllForms().filter(f => f.projectId === projectId)
}

export function getFormById(formId: string): Form | null {
  return getAllForms().find(f => f.id === formId) ?? null
}

export function saveForm(form: Form): Form {
  const all = getAllForms()
  const idx = all.findIndex(f => f.id === form.id)
  const updated: Form = { ...form, updatedAt: new Date().toISOString() }
  if (idx >= 0) {
    all[idx] = updated
  } else {
    all.push(updated)
  }
  localStorage.setItem(FORMS_KEY, JSON.stringify(all))
  return updated
}

export function deleteFormById(formId: string): void {
  const all = getAllForms().filter(f => f.id !== formId)
  localStorage.setItem(FORMS_KEY, JSON.stringify(all))
}
