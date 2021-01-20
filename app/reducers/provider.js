import React from 'react';
import { View, Text } from 'react-native';
import { InventoryContextProvider } from './inventory';
import { LoadingContextProvider } from './loader';

export default function Provider({ children }) {
  return (
    <InventoryContextProvider>
      <LoadingContextProvider>{children}</LoadingContextProvider>
    </InventoryContextProvider>
  );
}
