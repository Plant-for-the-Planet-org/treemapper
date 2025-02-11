import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ProfileScreen from './profile/screen'
import SettingsIndexScreen from './screen'

const SettingsNavigationStack = createNativeStackNavigator<{
  '/dashboard/settings': undefined
  '/dashboard/settings.index': undefined
  '/dashboard/settings/profile': undefined
  '/dashboard/settings/notifications': undefined
}>()

export default function SettingsNavigation() {
  console.log('SettingsNavigation')
  return (
    <SettingsNavigationStack.Navigator
      id={'dashboard.settings'}
      // initialRouteName="/dashboard/settings.index"
      initialRouteName="/dashboard/settings/profile"
      screenOptions={{ headerShown: false }}>
      <SettingsNavigationStack.Screen
        name="/dashboard/settings.index"
        component={SettingsIndexScreen}
      />
      <SettingsNavigationStack.Screen
        name="/dashboard/settings/profile"
        component={ProfileScreen}
      />
      <SettingsNavigationStack.Screen
        name="/dashboard/settings/notifications"
        component={ProfileScreen}
      />
    </SettingsNavigationStack.Navigator>
  )
}
