// app/provider.tsx
'use client'

import { SolitoImageProvider } from 'solito/image'
import { NavigationProvider } from 'solito/navigation'

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <NavigationProvider>
      <SolitoImageProvider>{children}</SolitoImageProvider>
    </NavigationProvider>
  )
}
