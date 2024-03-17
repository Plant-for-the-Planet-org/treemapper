import * as React from 'react'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {BottomTabParamList} from 'src/types/type/navigation'
import MainMapView from 'src/screens/MainMapView'
import Interventions from 'src/screens/InterventionView'
import ComingSoon from 'src/screens/ComingSoonView'
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
        component={MainMapView}
        options={{
          tabBarIcon: ({focused}) => {
            return <BottomTabIcon label={'Map'} index={0} isFocused={focused} />
          },
        }}
      />
      <BottomTabStack.Screen
        name="Interventions"
        component={Interventions}
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
        component={ComingSoon}
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
    elevation:0,

  },
})
