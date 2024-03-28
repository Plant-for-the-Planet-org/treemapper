import React from 'react'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import BottomTabStack from './BottomTabStack'
import Screens from 'src/screens'
import {RootStackParamList} from 'src/types/type/navigation'

const Stack = createNativeStackNavigator<RootStackParamList>()

const RootNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="SyncSpecies" component={Screens.SyncSpecies} />
      <Stack.Screen name="Home" component={BottomTabStack} />
      <Stack.Screen
        name="SingleTreeRegister"
        component={Screens.SingleTreeRegister}
      />
      <Stack.Screen name="TakePicture" component={Screens.TakePicture} />
      <Stack.Screen name="CreatePolygon" component={Screens.CreatePolygon} />
      <Stack.Screen
        name="HomeSideDrawer"
        component={Screens.HomeSideDrawer}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animation:'slide_from_left'
        }}
      />
    </Stack.Navigator>
  )
}

export default RootNavigator
