import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './react-query'
import { TamaguiProvider } from './tamagui'

export function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider>
        <>{children}</>
      </TamaguiProvider>
    </QueryClientProvider>
  )
}

export { Wrapper as DashboardProvider }
