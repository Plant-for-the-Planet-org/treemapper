import React from 'react'
import {RealmProvider as Provider} from '@realm/react'
import schema from './schema'
import {runRealmMigrations} from './migrations'

const schemaVersion = 5

export function RealmProvider({children}: {children: React.ReactNode}) {
  return (
    <Provider
      schema={schema}
      schemaVersion={schemaVersion}
      onMigration={(oldRealm, newRealm) => {
        runRealmMigrations({oldRealm, newRealm})
      }}>
      {children}
    </Provider>
  )
}
