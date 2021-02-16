import Realm from 'realm';
import schema0 from './migrations/schema0';
import schema1 from './migrations/schema1';

export const schemas = [schema0, schema1];

export const getSchema = () => schemas[schemas.length - 1];

export function migrateRealm(isMigrationRequired) {
  return new Promise((resolve) => {
    try {
      // The first schema to update to is the current schema version
      // since the first schema in our array is at nextSchemaIndex
      let nextSchemaIndex = Realm.schemaVersion(Realm.defaultPath);

      // If Realm.schemaVersion() returned -1, it means this is a new Realm file
      // so no migration is needed.
      if (nextSchemaIndex !== -1 && nextSchemaIndex < schemas.length - 1) {
        isMigrationRequired(true);
        // This will help to migrate the schema sequentially starting from the
        // current schema version of the user to the latest one. This will help to
        // avoid rewriting any old migrations code to match with new one, if the user
        // missed any update.
        while (nextSchemaIndex < schemas.length) {
          const migratedRealm = new Realm(schemas[nextSchemaIndex++]);
          migratedRealm.close();
        }
      }
      resolve();
    } catch (err) {
      console.error(`Error while setting up realm connection, ${JSON.stringify(err)}`);
    }
  });
}
