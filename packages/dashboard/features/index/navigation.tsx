import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import DashboardIndexScreen from './screen'
import MyProfile from '../profile/screen'
import CreateProject from '../projectCreation/screen'
import CreateSite from '../siteCreation/screen'


// Create a stack for all dashboard screens
const DashboardStack = createNativeStackNavigator<{
  index: undefined,
  me: undefined,
  createproject: undefined,
  createsite: undefined,
  // Add other screens as needed
}>()

export default function DashboardNavigation() {
  return (
    <DashboardStack.Navigator
      initialRouteName="index"
      screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen
        name="index"
        component={DashboardIndexScreen}
      />
      <DashboardStack.Screen
        name="me"
        component={MyProfile}
      />
      <DashboardStack.Screen
        name="createproject"
        component={CreateProject}
      />
            <DashboardStack.Screen
        name="createsite"
        component={CreateSite}
      />
      {/* Add other screens as needed */}
    </DashboardStack.Navigator>
  )
}