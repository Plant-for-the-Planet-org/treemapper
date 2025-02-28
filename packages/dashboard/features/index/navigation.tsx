import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import DashboardIndexScreen from './screen'
import OverviewScreen from '../overview/screen'
import ProfileSettings from '../settings/screen'
import MembersScreen from '../teams/members/screen'
import SingleMemberScreen from '../teams/members/single.screen'

const DashboardNavigationStack = createNativeStackNavigator<{
  dashboard: undefined
  '/dashboard.index': undefined
  '/dashboard/overview`': undefined
  '/dashboard/species': undefined
  '/dashboard/teams': undefined
  '/dashboard/teams/members': undefined
  '/dashboard/teams/members/:memberId': undefined
  '/dashboard/settings': undefined
}>()

export default function DashboardNavigation() {
  return (
    <DashboardNavigationStack.Navigator
      id={'dashboard'}
      initialRouteName="dashboard"
      screenOptions={{ headerShown: false }}>
      <DashboardNavigationStack.Screen
        name="dashboard"
        component={DashboardIndexScreen}
      />
      <DashboardNavigationStack.Screen
        name="/dashboard/overview"
        component={OverviewScreen}
      />
      {/* <DashboardNavigationStack.Screen
        name="/dashboard/teams"
        component={TeamsScreen}
      /> */}
      <DashboardNavigationStack.Screen
        name="/dashboard/teams/members"
        component={MembersScreen}
      />
      <DashboardNavigationStack.Screen
        name="/dashboard/teams/members/:memberId"
        component={SingleMemberScreen}
      />
      {/* This above route might come handly while introducing workspace & make sense */}
      <DashboardNavigationStack.Screen
        name="/dashboard/settings"
        component={ProfileSettings}
      />
    </DashboardNavigationStack.Navigator>
  )
}
