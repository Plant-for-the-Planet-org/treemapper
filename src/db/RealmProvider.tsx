import React from 'react'
import { RealmProvider as Provider } from '@realm/react'
import schema from './schema'
import { runRealmMigrations } from './migrations'
import Realm from 'realm'
const schemaVersion = 26

const realmConfig = {
  schemaVersion: schemaVersion,
  schema: schema
}

export const appRealm = new Realm(realmConfig)

interface Props { children: React.ReactNode }

export function RealmProvider(props: Props) {
  return (
    <Provider
      schema={schema}
      schemaVersion={schemaVersion}
      onMigration={(oldRealm, newRealm) => {
        runRealmMigrations({ oldRealm, newRealm })
      }}>
      {props.children}
    </Provider>
  )
}
