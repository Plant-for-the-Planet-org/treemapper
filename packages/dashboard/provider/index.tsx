import React from "react";
import { NavigationProvider } from "./navigation";
import {UiProvider} from "./dripsy"

export function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NavigationProvider>
      <UiProvider>
      {children}
      </UiProvider>
    </NavigationProvider>
  );
}
