'use client';


import React from 'react'
import { TamaguiProvider } from './tamagui'

export function Wrapper({ children }: { children: React.ReactNode }) {
  return (
      <TamaguiProvider>
        <>{children}</>
      </TamaguiProvider>
  )
}

export { Wrapper as DashboardProvider }
