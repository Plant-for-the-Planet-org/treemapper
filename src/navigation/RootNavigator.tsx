import React from 'react'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import BottomTabStack from './BottomTabStack'

const Stack = createNativeStackNavigator()

const RootNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Home" component={BottomTabStack} />
    </Stack.Navigator>
  )
}

export default RootNavigator
