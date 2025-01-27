import { TamaguiProvider } from 'tamagui'
import config from './tamagui.config'
import React from 'react'

export function UiProvider({ children }: { children: React.ReactNode }) {
  return (
    <TamaguiProvider config={config}>
      {children}
    </TamaguiProvider>
  )
}