import React from 'react'
import { RealmProvider as Provider } from '@realm/react'
import schema from './schema'
import { runRealmMigrations } from './migrations'
import Realm from 'realm'
const schemaVersion = 27

const realmConfig = {
  schemaVersion: schemaVersion,
  schema: schema
}

export const appRealm = new Realm(realmConfig)


interface Props { 
  children: React.ReactNode;
}

// Mark the props as read-only
type ReadonlyProps = Readonly<Props>;

export function RealmProvider(props: ReadonlyProps) {
  return (
    <Provider
      schema={schema}
      schemaVersion={schemaVersion}
      onMigration={(oldRealm, newRealm) => {
        runRealmMigrations({ oldRealm, newRealm });
      }}
    >
      {props.children}
    </Provider>
  );
}