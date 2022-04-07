import React from 'react';
import { InventoryContextProvider } from './inventory';
import { LoadingContextProvider } from './loader';
import { SpeciesContextProvider } from './species';
import { UserContextProvider } from './user';
import { NavigationContextProvider } from './navigation';
import { AdditionalDataContextProvider } from './additionalData';
import { PlantLocationHistoryContextProvider } from './plantLocationHistory';

export default function Provider({ children }) {
  return (
    <NavigationContextProvider>
      <UserContextProvider>
        <InventoryContextProvider>
          <PlantLocationHistoryContextProvider>
            <LoadingContextProvider>
              <SpeciesContextProvider>
                <AdditionalDataContextProvider>{children}</AdditionalDataContextProvider>
              </SpeciesContextProvider>
            </LoadingContextProvider>
          </PlantLocationHistoryContextProvider>
        </InventoryContextProvider>
      </UserContextProvider>
    </NavigationContextProvider>
  );
}
