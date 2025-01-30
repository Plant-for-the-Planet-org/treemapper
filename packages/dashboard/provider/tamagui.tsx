import { TamaguiProvider as Tamagui } from 'tamagui'
import config from './tamagui.config'
import React from 'react'

export function TamaguiProvider({ children }: { children: React.ReactNode }) {
  return <Tamagui config={config}>{children}</Tamagui>
}
