import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import HomeScreen from '../pages/home/Home'
const ABC=()=>{
  return null
}

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
        component={HomeScreen}
      />
      <DashboardStack.Screen
        name="me"
        component={ABC}
      />
      <DashboardStack.Screen
        name="createproject"
        component={ABC}
      />
      <DashboardStack.Screen
        name="createsite"
        component={ABC}
      />
      <DashboardStack.Screen
        name="notification"
        component={ABC}
      />
      {/* Add other screens as needed */}
    </DashboardStack.Navigator>
  )
}