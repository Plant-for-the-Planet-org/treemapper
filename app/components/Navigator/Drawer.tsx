import React from 'react';
import { useWindowDimensions } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';

import BottomTab from './BottomTab';
import { Colors } from '../../styles';
import { CustomDrawer } from '../Common';
import AdditionalData from '../AdditionalData';
import { DownloadMap, ManageProjects, ManageSpecies } from '../../components';
import Logs from '../Logs/index';
const Drawer = createDrawerNavigator();

const NavDrawer = () => {
  const dimensions = useWindowDimensions();
  const isLargeScreen = dimensions.width >= 768;
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: isLargeScreen ? 'permanent' : 'front',
        drawerStyle: isLargeScreen
          ? null
          : {
              width: dimensions.width,

              backgroundColor: Colors.WHITE,
            },
      }}>
      <Drawer.Screen name="BottomTab" component={BottomTab} />
      <Drawer.Screen name="ManageSpecies" component={ManageSpecies} />
      <Drawer.Screen name="ManageProjects" component={ManageProjects} />
      <Drawer.Screen name="AdditionalData" component={AdditionalData} />
      <Drawer.Screen name="DownloadMap" component={DownloadMap} />
      <Drawer.Screen name="ActivityLogs" component={Logs} />
    </Drawer.Navigator>
  );
};

export default NavDrawer;
