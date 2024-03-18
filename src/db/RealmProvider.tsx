import React from 'react'
import {RealmProvider as Provider} from '@realm/react'
import {RealmDatabase} from './realm'
import schema from './schema'

export const realmConfig = () => ({
  path: RealmDatabase.file,
  schema,
  schemaVersion: RealmDatabase.schemaVersion,
})


export function RealmProvider({children}:{children:React.ReactNode}) {
  return (
    <Provider
      path={RealmDatabase.file}
      schema={schema}
      schemaVersion={RealmDatabase.schemaVersion}>
      {children}
    </Provider>
  )
}
