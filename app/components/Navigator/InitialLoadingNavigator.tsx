import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import InitialLoading from '../InitialLoading';
import { NavigationContext } from '../../reducers/navigation';

const Stack = createStackNavigator();
const screenOptions = { headerShown: false };

export default function InitialLoadingNavigator() {
  const { initialNavigationScreen } = useContext(NavigationContext);
  return (
    <Stack.Navigator
      screenOptions={screenOptions}
      initialRouteName={initialNavigationScreen || 'MigratingDB'}>
      <Stack.Screen name="MigratingDB" component={InitialLoading} />
      <Stack.Screen name="SpeciesLoading" component={InitialLoading} />
    </Stack.Navigator>
  );
}
