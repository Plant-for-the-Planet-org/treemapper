import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import DashboardIndexScreen from './screen'
import OverviewScreen from '../overview/screen'
import SettingNavigation from '../settings/navigation'

const DashboardNavigationStack = createNativeStackNavigator<{
  'dashboard.index': undefined
  'dashboard.overview': undefined
  'dashboard.species': undefined
  'dashboard.teams': undefined
  'dashboard.settings': undefined
}>()

export default function DashboardNavigation() {
  return (
    <DashboardNavigationStack.Navigator
      id={'dashboard'}
      initialRouteName="dashboard.index"
      screenOptions={{ headerShown: false }}>
      <DashboardNavigationStack.Screen
        name="dashboard.index"
        component={DashboardIndexScreen}
      />
      <DashboardNavigationStack.Screen
        name="dashboard.overview"
        component={OverviewScreen}
      />
      <DashboardNavigationStack.Screen
        name="dashboard.settings"
        component={SettingNavigation}
      />
    </DashboardNavigationStack.Navigator>
  )
}
