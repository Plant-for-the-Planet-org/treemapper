import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import DashboardIndexScreen from './screen'
import MyProfile from '../profile/screen'
// Other imports...

// Create a stack for all dashboard screens
const DashboardStack = createNativeStackNavigator<{
  index: undefined,
  me: undefined,
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
      {/* Add other screens as needed */}
    </DashboardStack.Navigator>
  )
}