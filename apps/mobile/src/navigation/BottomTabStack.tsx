import * as React from 'react'
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs'
import { BottomTabParamList } from 'src/types/type/navigation.type'
import Screens from 'src/screens'
import BottomTabBar from 'src/components/bottomTab/BottomTabBar'
import { useTranslation } from 'react-i18next'

const BottomTabStack = createBottomTabNavigator<BottomTabParamList>()

// "Add" is a button, not a destination. It stays registered so the tab bar
// gets a fourth slot of its own width; nothing ever navigates to it.
const Blank = () => {
  return null
}

const BottomStack = () => {
  const { t } = useTranslation()

  // The whole bar is drawn by one component now -- shape, icons and the "+"
  // button all read the same geometry, so nothing can drift apart on a
  // different screen size. See components/bottomTab/tabBarGeometry.ts.
  const renderTabBar = (tabBarProps: BottomTabBarProps) => (
    <BottomTabBar {...tabBarProps} />
  )

  return (
    <BottomTabStack.Navigator
      backBehavior="none"
      initialRouteName="Map"
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
      }}>
      <BottomTabStack.Screen
        name="Map"
        component={Screens.HomeMapView}
        options={{ tabBarLabel: t('label.map') }}
      />
      <BottomTabStack.Screen
        name="Interventions"
        component={Screens.Interventions}
        options={{ tabBarLabel: t('label.interventions') }}
      />
      <BottomTabStack.Screen
        name="Plots"
        component={Screens.PlotView}
        options={{ tabBarLabel: t('label.plots') }}
      />
      <BottomTabStack.Screen
        name="Add"
        component={Blank}
        options={{ tabBarLabel: t('label.add') }}
      />
    </BottomTabStack.Navigator>
  )
}

export default BottomStack
