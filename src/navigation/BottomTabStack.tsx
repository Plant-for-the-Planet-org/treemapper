import * as React from 'react'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {BottomTabParamList} from 'src/types/type/navigation'
import Dummy from 'src/components/Dummy'
import BottomTabIcon from 'src/components/bottomTab/BottomTabIcon'
import AddBottomTabIcon from 'src/components/bottomTab/AddBottomTabIcon'

const BottomTabStack = createBottomTabNavigator<BottomTabParamList>()

const BottomStack = () => {
  return (
    <BottomTabStack.Navigator
      backBehavior="none"
      initialRouteName="Map"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          position: 'absolute', 
          borderTopWidth: 0,
          elevation:0,
          height:60
        }
      }}>
      <BottomTabStack.Screen
        name="Map"
        component={Dummy}
        options={{tabBarIcon: () => <BottomTabIcon label="Map" index={0} />}}
      />
      <BottomTabStack.Screen
        name="Interventions"
        component={Dummy}
        options={{tabBarIcon: () => <BottomTabIcon label="Intervention" index={1} />}}
      />
      <BottomTabStack.Screen
        name="Plots"
        component={Dummy}
        options={{tabBarIcon: () => <BottomTabIcon label="Plots" index={2} />}}
      />
      <BottomTabStack.Screen
        name="Add"
        component={Dummy}
        options={{tabBarIcon: () => <AddBottomTabIcon label='add' index={0}/>}}
      />
    </BottomTabStack.Navigator>
  )
}

export default BottomStack;