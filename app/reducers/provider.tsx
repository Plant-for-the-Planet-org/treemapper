import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { InventoryContextProvider } from './inventory';
import { LoadingContextProvider } from './loader';
import { SpeciesContextProvider } from './species';
import { UserContextProvider } from './user';
import { NavigationContextProvider } from './navigation';
import { AdditionalDataContextProvider } from './additionalData';
import { PlantLocationHistoryContextProvider } from './plantLocationHistory';
import { ProjectContextProvider } from './project';
import { store } from '../redux/store';

export default function Provider({ children }) {
  return (
    <NavigationContextProvider>
      <UserContextProvider>
        <ReduxProvider store={store}>
          <ProjectContextProvider>
            <InventoryContextProvider>
              <PlantLocationHistoryContextProvider>
                <LoadingContextProvider>
                  <SpeciesContextProvider>
                    <AdditionalDataContextProvider>{children}</AdditionalDataContextProvider>
                  </SpeciesContextProvider>
                </LoadingContextProvider>
              </PlantLocationHistoryContextProvider>
            </InventoryContextProvider>
          </ProjectContextProvider>
        </ReduxProvider>
      </UserContextProvider>
    </NavigationContextProvider>
  );
}
