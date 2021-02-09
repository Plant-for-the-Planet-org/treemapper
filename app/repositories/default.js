import Realm from 'realm';
import schema0 from './migrations/schema0';
import schema1 from './migrations/schema1';

const schemas = [schema0, schema1];

export default function getRealmConnection() {
  return new Promise((resolve, reject) => {
    try {
      // The first schema to update to is the current schema version
      // since the first schema in our array is at nextSchemaIndex
      let nextSchemaIndex = Realm.schemaVersion(Realm.defaultPath);

      // If Realm.schemaVersion() returned -1, it means this is a new Realm file
      // so no migration is needed.
      if (nextSchemaIndex !== -1) {
        // This will help to migrate the schema sequentially starting from the
        // current schema version of the user to the latest one. This will help to
        // avoid rewriting any old migrations code to match with new one, if the user
        // missed any update.
        while (nextSchemaIndex < schemas.length) {
          const migratedRealm = new Realm(schemas[nextSchemaIndex++]);
          migratedRealm.close();
        }
      }

      // Open the Realm with the latest schema
      resolve(Realm.open(schemas[schemas.length - 1]));
    } catch (err) {
      console.error(`Error while setting up realm connection, ${JSON.stringify(err)}`);
    }
  });
}
