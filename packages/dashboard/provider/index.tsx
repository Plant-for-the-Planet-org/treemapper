import React from 'react'
import { NavigationProvider } from './navigation'
import { TamaguiProvider } from './tamagui'

export function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    // <NavigationProvider>
    <TamaguiProvider>
      <>{children}</>
    </TamaguiProvider>
    // </NavigationProvider>
  )
}

export { Wrapper as DashboardProvider }
