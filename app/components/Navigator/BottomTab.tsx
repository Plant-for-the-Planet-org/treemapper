import React from 'react';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import MainScreen from '../MainScreen';
import { ComingSoon } from '../Common';
import BottomBar from '../MainScreen/BottomBar';

const screenOptions = { headerShown: false };

const Tab = createBottomTabNavigator();

const BottomTab = () => {
  const tabBar = (props: BottomTabBarProps) => <BottomBar {...props} />;
  return (
    <Tab.Navigator screenOptions={screenOptions} tabBar={tabBar}>
      <Tab.Screen name="MainScreen" component={MainScreen} />
      <Tab.Screen name="Intervention" component={ComingSoon} />
      <Tab.Screen name="Plots" component={ComingSoon} />
    </Tab.Navigator>
  );
};

export default BottomTab;
