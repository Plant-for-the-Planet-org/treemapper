import React from 'react';
import { InventoryContextProvider } from './inventory';
import { LoadingContextProvider } from './loader';
import { SpeciesContextProvider } from './species';
import { UserContextProvider } from './user';
import { NavigationContextProvider } from './navigation';

export default function Provider({ children }) {
  return (
    <NavigationContextProvider>
      <UserContextProvider>
        <InventoryContextProvider>
          <LoadingContextProvider>
            <SpeciesContextProvider>{children}</SpeciesContextProvider>
          </LoadingContextProvider>
        </InventoryContextProvider>
      </UserContextProvider>
    </NavigationContextProvider>
  );
}
