import { useCallback } from 'react'
import { useRealm, Realm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import {
  FormPrefillData,
  FormValues,
  ProjectFormData,
  ServerForm,
} from 'src/types/interface/projectForm.interface'

const useFormsData = () => {
  const realm = useRealm()

  // Reconciles cached forms for a project with the latest server response.
  // - Forms in the response are created/updated (UpdateMode.Modified keeps identity).
  // - Forms in Realm for this project but absent from the response are deleted
  //   (deleted/unpublished on the server).
  // NOTE: only call with an authoritative (successful) response. A failed or
  // offline fetch must be handled by the caller and must not reach here, else
  // it would wipe the offline cache.
  const upsertProjectForms = useCallback(
    async (projectId: string, forms: ServerForm[]): Promise<boolean> => {
      try {
        realm.write(() => {
          const responseIds = new Set<string>()

          forms.forEach((form) => {
            responseIds.add(form.id)
            const mapped: ProjectFormData = {
              id: form.id,
              name: form.name || '',
              description: form.description || '',
              project_id: projectId,
              status: form.status || 'published',
              site_assignment: form.siteAssignment || 'all',
              intervention_assignment: form.interventionAssignment || 'all',
              site_ids: form.siteIds || [],
              intervention_types: form.interventionTypes || [],
              sections: JSON.stringify(form.sections || []),
              created_at: form.createdAt || '',
              updated_at: form.updatedAt || '',
            }
            realm.create(RealmSchema.ProjectForm, mapped, Realm.UpdateMode.Modified)
          })

          // Drop forms for this project that the server no longer returns.
          const stale = realm
            .objects<ProjectFormData>(RealmSchema.ProjectForm)
            .filtered('project_id == $0 AND NOT id IN $1', projectId, Array.from(responseIds))
          realm.delete(stale)
        })
        return true
      } catch (error) {
        return false
      }
    },
    [realm],
  )

  const saveFormPrefill = useCallback(
    async (formId: string, values: FormValues): Promise<boolean> => {
      try {
        realm.write(() => {
          const data: FormPrefillData = {
            form_id: formId,
            values: JSON.stringify(values || {}),
            updated_at: Date.now(),
          }
          realm.create(RealmSchema.FormPrefill, data, Realm.UpdateMode.Modified)
        })
        return true
      } catch (error) {
        return false
      }
    },
    [realm],
  )

  const getFormPrefill = useCallback(
    (formId: string): FormValues => {
      const row = realm.objectForPrimaryKey<FormPrefillData>(RealmSchema.FormPrefill, formId)
      if (!row?.values) return {}
      try {
        return JSON.parse(row.values) as FormValues
      } catch (error) {
        return {}
      }
    },
    [realm],
  )

  return { upsertProjectForms, saveFormPrefill, getFormPrefill }
}

export default useFormsData
