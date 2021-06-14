import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import InitialLoading from '../InitialLoading';

const Stack = createStackNavigator();

export default function InitialLoadingNavigator() {
  return (
    <Stack.Navigator initialRouteName="MigratingDB" headerMode="none">
      <Stack.Screen name="MigratingDB" component={InitialLoading} />
      <Stack.Screen name="SpeciesLoading" component={InitialLoading} />
    </Stack.Navigator>
  );
}
