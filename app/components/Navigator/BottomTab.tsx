import React from 'react';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import MainScreen from '../MainScreen';
import { ComingSoon } from '../Common';
import BottomBar from '../MainScreen/BottomBar';
import NavDrawer from './Drawer';
import Interventions from '../../screens/Interventions/Interventions';

const screenOptions = { headerShown: false };

const Tab = createBottomTabNavigator();

const BottomTab = () => {
  const tabBar = (props: BottomTabBarProps) => <BottomBar {...props} />;
  return (
    <Tab.Navigator screenOptions={screenOptions} tabBar={tabBar}>
      <Tab.Screen name="MainScreen" options={{ tabBarLabel: 'Map' }} component={MainScreen} />
      <Tab.Screen name="Interventions" component={Interventions} />
      <Tab.Screen name="Plots" component={ComingSoon} />
    </Tab.Navigator>
  );
};

export default BottomTab;
