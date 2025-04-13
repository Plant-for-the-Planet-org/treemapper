import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import DashboardIndexScreen from '../pages/home/screen'
import MyProfile from '../pages/profile/screen'
import CreateProject from '../pages/projectCreation/screen'
import CreateSite from '../pages/siteCreation/screen'
import NotificationPanel from '../pages/notificationPannel/screen'


// Create a stack for all dashboard screens
const DashboardStack = createNativeStackNavigator<{
  index: undefined,
  me: undefined,
  createproject: undefined,
  createsite: undefined,
  notification: undefined,
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
      <DashboardStack.Screen
        name="notification"
        component={NotificationPanel}
      />
      {/* Add other screens as needed */}
    </DashboardStack.Navigator>
  )
}