import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRealm } from '@realm/react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import BottomTabStack from './BottomTabStack'
import Screens from 'src/screens'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { RootState } from 'src/store'
import { markOnboardingSeen } from 'src/store/slice/appStateSlice'
import { RealmSchema } from 'src/types/enum/db.enum'

const Stack = createNativeStackNavigator<RootStackParamList>()

/**
 * Onboarding is for fresh installs only. An install that is signed in or
 * already holds field data is an existing user who just updated the app, so
 * they skip it and are marked as having seen it. Decided once at mount, so a
 * sign-in mid-session never swaps the first screen under them.
 */
// TODO: set back to false before release. While true, the slides open on
// every launch for everyone, signed in or not, so they can be tested.
const ALWAYS_SHOW_ONBOARDING = true

const useShowOnboarding = () => {
  const realm = useRealm()
  const dispatch = useDispatch()
  // Older installs rehydrate without this field, hence the fallback.
  const seen = useSelector((state: RootState) => state.appState.onboardingSeen ?? false)
  const isLoggedIn = useSelector((state: RootState) => state.appState.isLoggedIn)
  const [show] = useState(() => {
    if (ALWAYS_SHOW_ONBOARDING) return true
    if (seen) return false
    if (isLoggedIn) return false
    return realm.objects(RealmSchema.Intervention).length === 0
  })

  useEffect(() => {
    if (!seen && !show) dispatch(markOnboardingSeen())
  }, [seen, show, dispatch])

  return show
}

const RootNavigator = () => {
  const showOnboarding = useShowOnboarding()
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={showOnboarding ? 'Onboarding' : 'Home'}>
      <Stack.Screen name="Home" component={BottomTabStack} />
      <Stack.Screen name="Onboarding" component={Screens.Onboarding} options={{ gestureEnabled: false }} />
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
      <Stack.Screen name="AddMeasurement" component={Screens.AddMeasurement} />
      <Stack.Screen name="TotalTrees" component={Screens.TotalTrees} />
      <Stack.Screen name="ManageProjects" component={Screens.ManageProjects} />
      <Stack.Screen name="DataExplorer" component={Screens.DataExplore} />
      <Stack.Screen name="InterventionPreview" component={Screens.InterventionPreview} />
      <Stack.Screen name="OfflineMap" component={Screens.OfflineMap} />
      <Stack.Screen name="OfflineMapSelection" component={Screens.OfflineMapSelection} />
      <Stack.Screen name='ReviewTreeDetails' component={Screens.ReviewTreeDetails} />
      <Stack.Screen name='ActivityLog' component={Screens.ActivityLogs} />
      {/* Additional Data is retired (AdditionalData, AdditionDataElement,
          SelectElement, LocalForm, ImportForm, MetaDataElement are no longer
          registered). EditAdditionData stays: it still edits the built-in
          intervention form, and legacy answers on older records. */}
      <Stack.Screen name='EditAdditionData' component={Screens.EditAdditionData} />
      <Stack.Screen name='AddInterventionData' component={Screens.AddInterventionData} />
      <Stack.Screen name='EditPolygon' component={Screens.EditPolygon} />
      <Stack.Screen name='CreatePlot' component={Screens.CreatePlot} />
      <Stack.Screen name='CreatePlotDetail' component={Screens.CreatePlotDetail} />
      <Stack.Screen name='CreatePlotMap' component={Screens.CreatePlotMap} />
      <Stack.Screen name='PlotDetails' component={Screens.PlotDetails} />
      <Stack.Screen name='PlotPlantRemeasure' component={Screens.PlotPlantRemeasure} />
      <Stack.Screen name='AddPlantDetailsPlot' component={Screens.AddPlantDetailsPlot} />
      <Stack.Screen name='AddPlotDetails' component={Screens.AddPlotDetails} />
      <Stack.Screen name='MonitoringInfo' component={Screens.MonitoringInfo} />
      <Stack.Screen name='AddRemeasurement' component={Screens.AddRemeasurement} />
      <Stack.Screen name='AddObservationForm' component={Screens.AddObservationForm} />
      <Stack.Screen name='PlotGroup' component={Screens.PlotGroup} />
      <Stack.Screen name='AddPlotGroup' component={Screens.AddPlotGroup} />
      <Stack.Screen name='AddPlotsToGroup' component={Screens.AddPlotsToGroup} />
      <Stack.Screen name='TreeRemeasurement' component={Screens.TreeRemeasurement} />
      <Stack.Screen name='OldInventoryDataView' component={Screens.OldInventoryData} />
      <Stack.Screen name='EditProject' component={Screens.EditProjectView} />
      <Stack.Screen name='PlantHistory' component={Screens.PlantHistory} />
      <Stack.Screen name="ProjectSites" component={Screens.ProjectSites} />
      <Stack.Screen name="DeleteAccount" component={Screens.DeleteAccount} />
      <Stack.Screen name="CreateProject" component={Screens.CreateProject} />
      <Stack.Screen name="Guide" component={Screens.Guide} />
      <Stack.Screen name="GuidedTours" component={Screens.GuidedTours} />
      <Stack.Screen name="Notification" component={Screens.Notification} />
      <Stack.Screen name="NotificationDetail" component={Screens.NotificationDetail} />
      <Stack.Screen name="Language" component={Screens.Language} />
      <Stack.Screen name="PlotGallery" component={Screens.PlotGallery} />
      <Stack.Screen name="PlannedTreeEdit" component={Screens.PlannedTreeEdit} />
      <Stack.Screen name="PlannedTreeLocation" component={Screens.PlannedTreeLocation} />
      <Stack.Screen name="Forms" component={Screens.Forms} />
      <Stack.Screen name="FormDetail" component={Screens.FormDetail} />
      <Stack.Screen name="LegacyForms" component={Screens.LegacyForms} />
      <Stack.Screen name="LegacyFormSync" component={Screens.LegacyFormSync} />
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
