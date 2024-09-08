import * as React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { BottomTabParamList } from 'src/types/type/navigation.type'
import Screens from 'src/screens'
import BottomTabIcon from 'src/components/bottomTab/BottomTabIcon'
import { StyleSheet } from 'react-native'
import AddBottomTabIcon from 'src/components/bottomTab/AddBottomTabIcon'
import i18next from 'i18next'

const BottomTabStack = createBottomTabNavigator<BottomTabParamList>()

const Blank = () => {
  return null
}

const BottomStack = () => {
  const mapIcon = ({ focused }) => {
    return <BottomTabIcon label={i18next.t('label.map')} index={0} isFocused={focused} />
  }
  const interventionIcon = ({ focused }) => {
    return (
      <BottomTabIcon
        label={i18next.t('label.interventions')}
        index={1}
        isFocused={focused}
      />
    )
  }
  const plotIcon = ({ focused }) => {
    return (
      <BottomTabIcon label={i18next.t('label.plots')} index={2} isFocused={focused} />
    )
  }
  const addIcon = () => {
    return <AddBottomTabIcon />
  }
  return (
    <BottomTabStack.Navigator
      backBehavior="none"
      initialRouteName="Map"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: { ...styles.container },
      }}>
      <BottomTabStack.Screen
        name="Map"
        component={Screens.HomeMapView}
        options={{
          tabBarIcon: mapIcon,
        }}
      />
      <BottomTabStack.Screen
        name="Interventions"
        component={Screens.Interventions}
        options={{
          tabBarIcon: interventionIcon,
        }}
      />
      <BottomTabStack.Screen
        name="Plots"
        component={Screens.PlotView}
        options={{
          tabBarIcon: plotIcon
        }}
      />
      <BottomTabStack.Screen
        name="Add"
        component={Blank}
        options={{
          tabBarButton: addIcon,
        }}
      />
    </BottomTabStack.Navigator>
  )
}

export default BottomStack

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    margin: 0,
    padding: 0,
    borderTopWidth: 0,
    // width: '100%',
    // height: 100,
    position: 'absolute',
    elevation: 0,
    width: '100%',
    height: 100,
  },
})
