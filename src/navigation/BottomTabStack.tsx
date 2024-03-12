import * as React from 'react'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {BottomTabParamList} from 'src/types/type/navigation'
import Dummy from 'src/components/Dummy'
import TabBar from 'src/components/bottomTab/BottomTabBar'
import MainMapView from 'src/screens/MainMapView'

const BottomTabStack = createBottomTabNavigator<BottomTabParamList>()

const BottomStack = () => {
  return (
    <BottomTabStack.Navigator
      backBehavior="none"
      initialRouteName="Map"
      tabBar={props => <TabBar {...props} />}
      screenOptions={{
        headerShown: false
      }}>
      <BottomTabStack.Screen name="Map" component={MainMapView} />
      <BottomTabStack.Screen name="Interventions" component={Dummy} />
      <BottomTabStack.Screen name="Plots" component={Dummy} />
      <BottomTabStack.Screen name="Add" component={Dummy} />
    </BottomTabStack.Navigator>
  )
}

export default BottomStack
