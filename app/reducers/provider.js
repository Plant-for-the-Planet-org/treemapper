import React from 'react';
import { InventoryContextProvider } from './inventory';
import { LoadingContextProvider } from './loader';
import { SpeciesContextProvider } from './species';

export default function Provider({ children }) {
  return (
    <InventoryContextProvider>
      <LoadingContextProvider>
        <SpeciesContextProvider>{children}</SpeciesContextProvider>
      </LoadingContextProvider>
    </InventoryContextProvider>
  );
}
