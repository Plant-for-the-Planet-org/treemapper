import React from 'react';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import MainScreen from '../MainScreen';
import { ComingSoon } from '../Common';
import BottomBar from '../MainScreen/BottomBar';
import TreeInventory from '../TreeInventory';
import i18next from 'i18next';

const screenOptions = { headerShown: false };

const Tab = createBottomTabNavigator();

const AddComponent = () => {
  return null;
};

const BottomTab = () => {
  const tabBar = (props: BottomTabBarProps) => <BottomBar {...props} />;
  return (
    <Tab.Navigator screenOptions={screenOptions} tabBar={tabBar}>
      <Tab.Screen
        name="MainScreen"
        options={{ tabBarLabel: i18next.t('label.map') }}
        component={MainScreen}
      />
      <Tab.Screen
        name="TreeInventory"
        options={{ tabBarLabel: i18next.t('label.tree_inventory') }}
        component={TreeInventory}
      />
      <Tab.Screen
        name="Plots"
        options={{ tabBarLabel: i18next.t('label.plots') }}
        component={ComingSoon}
      />
      <Tab.Screen
        name="Add"
        options={{ tabBarLabel: i18next.t('label.add') }}
        component={AddComponent}
      />
    </Tab.Navigator>
  );
};

export default BottomTab;
