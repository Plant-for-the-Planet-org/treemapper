import React from 'react';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import MainScreen from '../MainScreen';
import BottomBar from '../MainScreen/BottomBar';

const screenOptions = { headerShown: false };

const Tab = createBottomTabNavigator();

const Intervention = () => {
  return null;
};
const Plots = () => {
  return null;
};

const BottomTab = () => {
  const tabBar = (props: BottomTabBarProps) => <BottomBar {...props} />;
  return (
    <Tab.Navigator screenOptions={screenOptions} tabBar={tabBar}>
      <Tab.Screen name="MainScreen" component={MainScreen} />
      <Tab.Screen name="Intervention" component={Intervention} />
      <Tab.Screen name="Plots" component={Plots} />
    </Tab.Navigator>
  );
};

export default BottomTab;
