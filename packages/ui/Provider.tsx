import { TamaguiProvider } from 'tamagui'
import config from './tamagui.config'

export function UiProvider({ children }: { children: React.ReactNode }) {
  return (
    <TamaguiProvider config={config}>
      {children}
    </TamaguiProvider>
  )
}