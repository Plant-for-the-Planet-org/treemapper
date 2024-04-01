import React from 'react'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import BottomTabStack from './BottomTabStack'
import Screens from 'src/screens'
import {RootStackParamList} from 'src/types/type/navigation.type'

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
      <Stack.Screen name="SelectSpecies" component={Screens.SelectSpecies} />
      <Stack.Screen name="AddMeasurment" component={Screens.AddMeasurment} />
      <Stack.Screen
        name="PreviewFormData"
        component={Screens.PreviewFormData}
      />
      <Stack.Screen name="ManageSpecies" component={Screens.ManageSpecies} />
      <Stack.Screen name="SpeciesInfo" component={Screens.SpeciesInfo} />
      <Stack.Screen name="SpeciesSearch" component={Screens.SpeciesSearch} />
      <Stack.Screen name="FormIntermediate" component={Screens.FormIntermediate} />
      <Stack.Screen name="PointMarker" component={Screens.PointMarker} />
      <Stack.Screen name="DynamicForm" component={Screens.DynamicForm} />

      <Stack.Screen
        name="HomeSideDrawer"
        component={Screens.HomeSideDrawer}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animation: 'slide_from_left',
        }}
      />
    </Stack.Navigator>
  )
}

export default RootNavigator
