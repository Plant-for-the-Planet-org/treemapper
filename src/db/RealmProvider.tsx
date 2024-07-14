import React from 'react'
import { RealmProvider as Provider } from '@realm/react'
import schema from './schema'
import { runRealmMigrations } from './migrations'
import Realm from 'realm'
const schemaVersion = 25

const realmConfig = {
  schemaVersion: schemaVersion,
  schema: schema
}

export const appRealm = new Realm(realmConfig)

export function RealmProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider
      schema={schema}
      schemaVersion={schemaVersion}
      onMigration={(oldRealm, newRealm) => {
        runRealmMigrations({ oldRealm, newRealm })
      }}>
      {children}
    </Provider>
  )
}
