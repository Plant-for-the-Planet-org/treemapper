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
      <Stack.Screen name="TakePicture" component={Screens.TakePicture} />
      <Stack.Screen name="PolygonMarker" component={Screens.PolygonMarker} />
      <Stack.Screen name="ManageSpecies" component={Screens.ManageSpecies} />
      <Stack.Screen name="SpeciesInfo" component={Screens.SpeciesInfo} />
      <Stack.Screen name="SpeciesSearch" component={Screens.SpeciesSearch} />
      <Stack.Screen name="PointMarker" component={Screens.PointMarker} />
      <Stack.Screen name="DynamicForm" component={Screens.DynamicForm} />
      <Stack.Screen
        name="InterventionForm"
        component={Screens.InterventionForm}
      />
      <Stack.Screen name="AddMeasurment" component={Screens.AddMeasurment} />
      <Stack.Screen name="TotalTrees" component={Screens.TotalTrees} />
      <Stack.Screen name="ManageProjects" component={Screens.ManageProjects} />
      <Stack.Screen name="DataExplorer" component={Screens.DataExplore} />
      <Stack.Screen name="InterventionPreview" component={Screens.InterventionPreview} />
      <Stack.Screen name="AdditionalData" component={Screens.AdditionalData} />
      <Stack.Screen name="OfflineMap" component={Screens.OfflineMap} />
      <Stack.Screen name="OfflineMapSelection" component={Screens.OfflineMapSelection} />
      <Stack.Screen name='ReviewTreeDetails' component={Screens.ReviewTreeDetails} />

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
