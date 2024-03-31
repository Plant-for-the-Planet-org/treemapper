import * as React from 'react'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {BottomTabParamList} from 'src/types/type/navigation.type'
import Screens from 'src/screens'
import BottomTabIcon from 'src/components/bottomTab/BottomTabIcon'
import {View, StyleSheet} from 'react-native'
import AddBottomTabIcon from 'src/components/bottomTab/AddBottomTabIcon'

const BottomTabStack = createBottomTabNavigator<BottomTabParamList>()

const Blank = () => {
  return null
}

const BottomStack = () => {
  return (
    <BottomTabStack.Navigator
      backBehavior="none"
      initialRouteName="Map"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {...styles.container},
        tabBarIcon: () => <View />,
      }}>
      <BottomTabStack.Screen
        name="Map"
        component={Screens.HomeMapView}
        options={{
          tabBarIcon: ({focused}) => {
            return <BottomTabIcon label={'Map'} index={0} isFocused={focused} />
          },
        }}
      />
      <BottomTabStack.Screen
        name="Interventions"
        component={Screens.Interventions}
        options={{
          tabBarIcon: ({focused}) => {
            return (
              <BottomTabIcon
                label={'Interventions'}
                index={1}
                isFocused={focused}
              />
            )
          },
        }}
      />
      <BottomTabStack.Screen
        name="Plots"
        component={Screens.PlotView}
        options={{
          tabBarIcon: ({focused}) => {
            return (
              <BottomTabIcon label={'Plots'} index={2} isFocused={focused} />
            )
          },
        }}
      />
      <BottomTabStack.Screen
        name="Add"
        component={Blank}
        options={{
          tabBarIcon: () => {
            return <AddBottomTabIcon />
          },
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
    height: 70,
    position: 'absolute',
    elevation: 0,
  },
})
