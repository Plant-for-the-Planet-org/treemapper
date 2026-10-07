import { useCallback } from 'react'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { IAdditionalDetailsForm } from 'src/types/interface/app.interface'

// Realm side of moving an Additional Data form into a project's Forms. The
// builder is gone, so this only reads what is already on the device and stamps
// a form once it has been accepted by the server.
const useLegacyFormMigration = () => {
  const realm = useRealm()

  // Stamps the local row with where the form went. Called only after the
  // server has answered with a form uid, so a failed or half-finished push
  // leaves the row untouched and the user can try again.
  const markFormMigrated = useCallback(
    async (
      formId: string,
      details: { formUid: string; projectId: string; projectName: string },
    ): Promise<boolean> => {
      try {
        realm.write(() => {
          const local = realm.objectForPrimaryKey<IAdditionalDetailsForm>(
            RealmSchema.AdditionalDetailsForm,
            formId,
          )
          if (!local) return
          local.migrated_form_id = details.formUid
          local.migrated_project_id = details.projectId
          local.migrated_project_name = details.projectName
          local.migrated_at = new Date().toISOString()
        })
        return true
      } catch (error) {
        return false
      }
    },
    [realm],
  )

  return { markFormMigrated }
}

export default useLegacyFormMigration
