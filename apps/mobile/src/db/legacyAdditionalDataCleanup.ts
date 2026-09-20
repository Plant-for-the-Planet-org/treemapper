import Realm from 'realm'
import Bugsnag from '@bugsnag/expo'
import { RealmSchema } from 'src/types/enum/db.enum'

/**
 * Additional Data (the on-device form builder and its metadata key/value list)
 * was retired in favour of Forms, which are defined on the web dashboard and
 * pulled into RealmSchema.ProjectForm. Every entry point is gone, but a device
 * that ran an older build still carries the definitions it created, so this
 * wipes them on launch. Without it those rows would sit in the file forever and
 * quietly come back to life if anything ever read them again.
 *
 * Answers already captured on an intervention (Intervention.form_data) are left
 * alone on purpose: that is field data somebody typed, and it still uploads with
 * the intervention it belongs to.
 *
 * Runs against the singleton realm rather than a schema migration, because
 * `appRealm` opens without a migration handler and therefore wins the race
 * against RealmProvider's onMigration. It is idempotent and costs two counts on
 * a device that has nothing to clear.
 */
export const clearLegacyAdditionalData = (realm: Realm) => {
  try {
    const forms = realm.objects(RealmSchema.AdditionalDetailsForm)
    const metadata = realm.objects(RealmSchema.Metadata)
    if (forms.length === 0 && metadata.length === 0) {
      return
    }
    realm.write(() => {
      realm.delete(forms)
      realm.delete(metadata)
    })
  } catch (error) {
    Bugsnag.notify(error as Error)
  }
}
