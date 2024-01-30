import React from 'react';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import MainScreen from '../MainScreen';
import { ComingSoon } from '../Common';
import BottomBar from '../MainScreen/BottomBar';
import TreeInventory from '../TreeInventory';

const screenOptions = { headerShown: false };

const Tab = createBottomTabNavigator();

const AddComponent = () => {
  return null;
};

const BottomTab = () => {
  const tabBar = (props: BottomTabBarProps) => <BottomBar {...props} />;
  return (
    <Tab.Navigator screenOptions={screenOptions} tabBar={tabBar}>
      <Tab.Screen name="MainScreen" options={{ tabBarLabel: 'Map' }} component={MainScreen} />
      <Tab.Screen
        name="TreeInventory"
        options={{ tabBarLabel: 'Tree Inventory' }}
        component={TreeInventory}
      />
      <Tab.Screen name="Plots" component={ComingSoon} />
      <Tab.Screen name="Add" component={AddComponent} />
    </Tab.Navigator>
  );
};

export default BottomTab;
