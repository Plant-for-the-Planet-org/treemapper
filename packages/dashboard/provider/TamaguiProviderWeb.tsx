'use client';

import { TamaguiProvider as TamaguiProviderOG } from 'tamagui';
import config from './tamagui.config';

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  return (
    <TamaguiProviderOG config={config} disableInjectCSS defaultTheme="light">
      {children}
    </TamaguiProviderOG>
  );
}