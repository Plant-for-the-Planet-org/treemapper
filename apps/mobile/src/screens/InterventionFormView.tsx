import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import React, { useEffect, useState } from 'react'
import Header from 'src/components/common/Header'
import CustomDropDown from 'src/components/common/CustomDropDown'
import { Colors } from 'src/utils/constants'
import CustomTextInput from 'src/components/common/CustomTextInput'
import CustomButton from 'src/components/common/CustomButton'
import { scaleSize } from 'src/utils/constants/mixins'
import PlaceHolderSwitch from 'src/components/common/PlaceHolderSwitch'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useDispatch, useSelector } from 'react-redux'
import { AvoidSoftInput, AvoidSoftInputView } from "react-native-avoid-softinput";
import { RootStackParamList } from 'src/types/type/navigation.type'
import { setUpIntervention } from 'src/utils/helpers/formHelper/selectIntervention'
import { usePostHog } from 'posthog-react-native'
import {
  captureAnalyticsEvent,
  AnalyticsEvents,
  incrementSessionCounter,
  trackFirstTimeEvent,
} from 'src/utils/analytics'
import useFormAnalytics from 'src/hooks/analytics/useFormAnalytics'
import { v4 as uuid } from 'uuid'
import { RootState } from 'src/store'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { DropdownData, ProjectInterface } from 'src/types/interface/app.interface'
import InterventionDatePicker from 'src/components/formBuilder/InterventionDatePicker'
import { AllIntervention } from 'src/utils/constants/knownIntervention'
import { INTERVENTION_TYPE } from 'src/types/type/app.type'
import { SafeAreaView } from 'react-native-safe-area-context'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper'
import { createBasePath } from 'src/utils/helpers/fileManagementHelper'
import SelectionLocationType from 'src/components/intervention/SelectLocationType'
import { useToast } from 'react-native-toast-notifications'
import { errorHaptic } from 'src/utils/helpers/hapticFeedbackHelper'
import useLogManagement from 'src/hooks/realm/useLogManagement'
import { RegisterFormSliceInitialState } from 'src/types/interface/slice.interface'
import { updateNewIntervention } from 'src/store/slice/appStateSlice'
import i18next from 'i18next'
import { getRandomPointInPolygon } from 'src/utils/helpers/generatePointInPolygon'
import CustomDatePicker from 'src/components/common/CustomDatePicker'
import bbox from '@turf/bbox'
import { updateMapBounds } from 'src/store/slice/mapBoundSlice'

const InterventionFormView = () => {
  const [projectStateData, setProjectStateData] = useState<DropdownData[]>([])
  const [projectSites, setProjectSites] = useState<DropdownData[]>([])
  const [locationName, setLocationName] = useState('')
  const [furtherInfo, setFurtherInfo] = useState('')
  const [allIntervention] = useState([...AllIntervention.filter(el => el.value !== 'single-tree-registration' && el.value !== 'multi-tree-registration')])
  const [locationType, setLocationType] = useState<'Polygon' | 'Point'>('Polygon')
  const [registerForm, setRegisterForm] = useState<RegisterFormSliceInitialState | null>(null)
  const userType = useSelector((state: RootState) => state.userState.type)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const dispatch = useDispatch()
  const { addNewLog } = useLogManagement()
  const { currentProject, projectSite } = useSelector(
    (state: RootState) => state.projectState,
  )

  const { initializeIntervention, updateInterventionLocation } = useInterventionManagement()

  const realm = useRealm()
  const route = useRoute<RouteProp<RootStackParamList, 'InterventionForm'>>()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const toast = useToast()
  const posthog = usePostHog()
  const UserType = useSelector(
    (state: RootState) => state.userState.type
  )

  const isTpoUser = true
  const paramId = route.params ? route.params.id : ''
  // The entry point to every non-tree intervention, and the screen where the
  // word "intervention" first appears. Its abandonment rate is the headline
  // number for section 9.
  const formAnalytics = useFormAnalytics('intervention_form')

  useEffect(() => {
    setUpRegisterFlow()
    AvoidSoftInput.setShouldMimicIOSBehavior(true);
    return () => {
      AvoidSoftInput.setShouldMimicIOSBehavior(false);
    };
  }, [])



  const setUpRegisterFlow = async () => {
    const result = await createBasePath()
    if (result.hasError) {
      addNewLog({
        logType: 'INTERVENTION',
        message: "Error occurred while creating root folder",
        logLevel: 'error',
        statusCode: '',
        logStack: result.msg
      })
      errorHaptic()
      toast.show("Something went wrong")
      navigation.goBack()
      return
    }
    addNewLog({
      logType: 'INTERVENTION',
      message: result.msg,
      logLevel: 'info',
      statusCode: '',
    })
    if (paramId) {
      skipForm(paramId)
    } else {
      handleInterventionType({ label: "Fire Patrol", value: 'fire-patrol', index: 0 })
      if (isTpoUser) {
        setupProjectAndSiteDropDown()
      }
    }
  }

  const toggleDatePicker = () => {
    setShowDatePicker(prev => !prev)
  }

  const handleBounds = (pid, sid, isPoint) => {
    try {
      if (isTpoUser) return;

      const ProjectData = realm.objectForPrimaryKey<ProjectInterface>(RealmSchema.Projects, pid);
      if (!ProjectData) return;

      const updateBounds = (geometry) => {
        const { geoJSON } = makeInterventionGeoJson('Point', [geometry], 'sd');
        const bounds = bbox(geoJSON);
        dispatch(updateMapBounds({ bounds, key: isPoint ? 'POINT_MAP' : 'POLYGON_MAP' }));
      };

      if (!sid || sid === 'other') {
        if (!ProjectData.geometry) return;
        const coords = JSON.parse(ProjectData.geometry);
        updateBounds(coords.coordinates);
      } else {
        const site = ProjectData.sites.find(el => el.id === sid);
        if (!site?.geometry) return; // Using optional chaining here
        const parsedGeometry = JSON.parse(site.geometry);
        const newCoords = getRandomPointInPolygon(parsedGeometry.coordinates[0]);
        updateBounds(newCoords);
      }
    } catch (error) {
      console.error("error", error);
    }
  };

  const skipForm = async (
    key: INTERVENTION_TYPE,
  ) => {
    const InterventionJSON = { ...setUpIntervention(key) }
    InterventionJSON.form_id = uuid()
    InterventionJSON.intervention_date = new Date().getTime()
    InterventionJSON.user_type = userType
    InterventionJSON.meta_data = '{}'
    InterventionJSON.project_name = currentProject.projectName
    InterventionJSON.project_id = currentProject.projectId
    InterventionJSON.site_name = projectSite.siteName
    InterventionJSON.site_id = projectSite.siteId
    const result = await initializeIntervention(InterventionJSON)
    if (isTpoUser) {
      handleBounds(InterventionJSON.project_id, InterventionJSON.site_id, InterventionJSON.location_type === 'Point')
    }
    if (result) {
      if (InterventionJSON.location_type === 'Point') {
        navigation.replace('PointMarker', { id: InterventionJSON.form_id })
      } else {
        navigation.replace('PolygonMarker', { id: InterventionJSON.form_id })
      }
      dispatch(updateNewIntervention())
    } else {
      toast.show("Error occurred while adding intervention")
      errorHaptic()
    }
  }

  const setupProjectAndSiteDropDown = () => {
    const projectData = realm.objects<ProjectInterface>(RealmSchema.Projects)
    const mappedData = projectData.map((el, i) => {
      return {
        label: el.name,
        value: el.id,
        index: i,
      }
    })
    if (mappedData?.length) {
      setProjectStateData(mappedData)
      if (projectData.length !== 0) {
        const siteMappedData = projectData[0].sites.map((el, i) => {
          return {
            label: el.name,
            value: el.id,
            index: i,
          }
        })
        setProjectSites(siteMappedData)
        handleProjectSelect({ label: currentProject.projectName, value: currentProject.projectId, index: 0 })
      }
    }
  }

  const handleProjectSelect = (item: DropdownData) => {
    const ProjectData = realm.objectForPrimaryKey<ProjectInterface>(
      RealmSchema.Projects,
      item.value,
    )
    const siteValidate = ProjectData.sites.map((el, i) => {
      return {
        label: el.name,
        value: el.id,
        index: i,
      }
    })
    if (siteValidate && siteValidate.length > 0) {
      setProjectSites([...siteValidate, {
        label: 'Other',
        value: 'other',
        index: 0,
      },])
      setRegisterForm(prevState => ({ ...prevState, project_id: ProjectData.id, project_name: ProjectData.name, site_name: siteValidate && siteValidate[0] ? siteValidate[0].label : '', site_id: siteValidate && siteValidate[0] ? siteValidate[0] : ''.value }))
    } else {
      setProjectSites([
        {
          label: 'Project has no site',
          value: '',
          index: 0,
        },
        {
          label: 'Other',
          value: 'other',
          index: 0,
        },
      ])
      setRegisterForm(prevState => ({ ...prevState, project_id: ProjectData.id, project_name: ProjectData.name, site_name: siteValidate && siteValidate[0] ? siteValidate[0].label : '', site_id: siteValidate && siteValidate[0] ? siteValidate[0] : ''.value }))
    }
  }

  const handleSiteSelect = (item: DropdownData) => {
    formAnalytics.fieldChanged('site_id')
    if (item.value) {
      setRegisterForm({
        ...registerForm, site_name: item.label, site_id: item.value
      })
    }
  }

  const handleInterventionType = (item: any) => {
    // Changing the intervention type repeatedly is the clearest sign someone
    // is unsure what the word covers. The form hook turns three of these
    // into a terminology signal by itself (see FIELD_TERMS).
    formAnalytics.fieldChanged('intervention_type')
    const InterventionJSON = setUpIntervention(item.value)
    InterventionJSON.form_id = uuid()
    InterventionJSON.intervention_date = new Date().getTime()
    InterventionJSON.user_type = userType
    if (registerForm) {
      InterventionJSON.project_name = registerForm.project_name
      InterventionJSON.project_id = registerForm.project_id
      InterventionJSON.site_name = registerForm.site_name
      InterventionJSON.site_id = registerForm.site_id
    }
    setRegisterForm(InterventionJSON)
  }

  const handleDateSelection = (n: number) => {
    if (!n) {
      setShowDatePicker(false)
      return
    }
    formAnalytics.fieldChanged('intervention_date')
    setRegisterForm(prevState => ({ ...prevState, intervention_date: n }))
    setShowDatePicker(false)
  }

  const handleEntireSiteArea = (b: boolean) => {
    setRegisterForm(prevState => ({ ...prevState, entire_site_selected: b }))
  }

  // Returns null when the site or its geometry is missing/invalid, so the
  // caller can surface an error instead of crashing on JSON.parse.
  const siteCoordinatesSelect = () => {
    const ProjectData = realm.objectForPrimaryKey<ProjectInterface>(
      RealmSchema.Projects,
      registerForm.project_id,
    )
    const currentSiteData = ProjectData?.sites.filter(
      el => el.id === registerForm.site_id,
    )
    if (!currentSiteData?.length || !currentSiteData[0].geometry) {
      return null
    }
    try {
      const parsedGeometry = JSON.parse(currentSiteData[0].geometry)
      if (!parsedGeometry?.coordinates?.[0]) {
        return null
      }
      const newCoords = getRandomPointInPolygon(parsedGeometry.coordinates[0])
      return [newCoords]
    } catch (error) {
      return null
    }
  }

  const pressContinue = async () => {
    try {
      prepareFormForSubmission();

      const metaData = constructMetaData(locationName, furtherInfo);
      registerForm.meta_data = JSON.stringify({
        app: {},
        public: { ...metaData, isEntireSite: registerForm.entire_site_selected },
        private: {}
      })
      const result = await initializeIntervention(registerForm);
      if (result) {
        // Read once, through a cast: the runtime object carries
        // intervention_key but RegisterFormSliceInitialState does not declare
        // it. Reused below so the analytics calls do not each repeat the cast.
        const interventionKey = (registerForm as any)?.intervention_key
        captureAnalyticsEvent(posthog, AnalyticsEvents.INTERVENTION_CREATED, {
          intervention_key: registerForm.intervention_key,
          project_id: registerForm.project_id,
          site_id: registerForm?.site_id || null,
          is_entire_site: Boolean(registerForm?.entire_site_selected),
          location_type: registerForm?.location_type,
          has_location_name: Boolean(locationName),
          has_further_info: Boolean(furtherInfo),
        })
        incrementSessionCounter('interventions_created')
        // "Notes" in the feature list is this free-text field. Length only,
        // never the text: it is the user's own field observation.
        if (furtherInfo) {
          captureAnalyticsEvent(posthog, AnalyticsEvents.NOTE_ADDED, {
            context: 'intervention_form',
            note_length: furtherInfo.length,
          })
        }
        trackFirstTimeEvent(AnalyticsEvents.FIRST_INTERVENTION_CREATED, {
          intervention_key: interventionKey,
        })
        formAnalytics.complete({
          intervention_key: interventionKey,
        })
        await handleSuccessfulInterventionInitialization();
      } else {
        formAnalytics.validationFailed('submit', 'initialize_failed')
        handleInterventionInitializationError();
      }
    } catch (error) {
      formAnalytics.validationFailed('submit', 'unexpected_error')
      logInitializationError(error);
    }
  };

  const prepareFormForSubmission = () => {

    if (registerForm.entire_site_selected && registerForm.site_id !== 'other') {
      registerForm.location_type = 'Point'
    }
    if (registerForm.site_id === 'other') {
      registerForm.entire_site_selected = false
    }
    if (registerForm.optionalLocation) {
      registerForm.location_type = locationType;
    }
  };

  const constructMetaData = (locationName: string, furtherInfo: string) => {
    const metaData = {};
    if (locationName && locationName.length > 0) {
      metaData["location-name"] = {
        "key": "location-name",
        "originalKey": "location-name",
        "value": locationName,
        "label": "Location Name",
        "type": "input",
        "unit": "",
        "visibility": "public",
        "dataType": "string",
        "elementType": "metaData"
      };
    }
    if (furtherInfo && furtherInfo.length > 0) {
      metaData["more-info"] = {
        "key": "more-info",
        "originalKey": "more-info",
        "value": furtherInfo,
        "label": "More Info",
        "type": "input",
        "unit": "",
        "visibility": "public",
        "dataType": "string",
        "elementType": "metaData"
      };
    }
    return metaData;
  };



  const handleSuccessfulInterventionInitialization = async () => {
    dispatch(updateNewIntervention());
    if (registerForm.entire_site_selected) {
      await handleEntireSiteSelected();
    } else {
      navigateToMarkerScreen();
    }
  };

  const handleEntireSiteSelected = async () => {
    const siteCoordinates = siteCoordinatesSelect();
    if (!siteCoordinates) {
      handleLocationUpdateError();
      return;
    }
    const { coordinates } = makeInterventionGeoJson(
      'Point',
      siteCoordinates,
      registerForm.form_id,
      ''
    );
    const locationUpdated = await updateInterventionLocation(
      registerForm.form_id,
      { type: 'Point', coordinates: coordinates },
      true
    );

    if (!locationUpdated) {
      handleLocationUpdateError();
      return;
    }

    navigateBasedOnFormDetails();
  };

  const handleLocationUpdateError = () => {
    errorHaptic();
    toast.show("Error occurred while updating location");
  };

  const navigateBasedOnFormDetails = () => {
    if (registerForm.species_required) {
      navigation.replace('ManageSpecies', { manageSpecies: false, id: registerForm.form_id });
    } else if (registerForm.form_details.length > 0) {
      navigation.replace('LocalForm', { id: registerForm.form_id });
    } else {
      navigation.replace('InterventionPreview', { id: 'review', intervention: '', interventionId: registerForm.form_id });
    }
  };

  const navigateToMarkerScreen = () => {
    if (isTpoUser) {
      handleBounds(registerForm.project_id, registerForm.site_id, registerForm.location_type === 'Point')
    }
    if (registerForm.location_type === 'Point') {
      navigation.replace('PointMarker', { id: registerForm.form_id });
    } else {
      navigation.replace('PolygonMarker', { id: registerForm.form_id });
    }
  };

  const handleInterventionInitializationError = () => {
    addNewLog({
      logType: 'INTERVENTION',
      message: 'Error occurred while creating intervention',
      logLevel: 'error',
      statusCode: ''
    });
    toast.show("Error occurred while creating intervention");
    errorHaptic();
  };

  const logInitializationError = (error: any) => {
    addNewLog({
      logType: 'INTERVENTION',
      message: 'Error occurred while creating intervention',
      logLevel: 'error',
      statusCode: '12',
      logStack: JSON.stringify(error)
    });
  };


  if (!registerForm) {
    return (
      <ActivityIndicator size="small" color={Colors.NEW_PRIMARY} style={styles.activityIndicator} />
    )
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header label={i18next.t('label.intervention')} />
      {showDatePicker && <CustomDatePicker cb={handleDateSelection}
        selectedData={registerForm.intervention_date || Date.now()}
      />}
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <AvoidSoftInputView
          avoidOffset={20}
          showAnimationDuration={200}
          style={styles.container}>
          <View style={styles.container}>
            <View style={styles.wrapper}>
              {isTpoUser && (
                <CustomDropDown
                  label={i18next.t('label.project')}
                  data={projectStateData}
                  onSelect={handleProjectSelect}
                  selectedValue={{
                    label: registerForm.project_name,
                    value: registerForm.project_id,
                    index: 0,
                  }}
                />
              )}
              {isTpoUser && (
                <CustomDropDown
                  label={i18next.t('label.site')}
                  data={projectSites}
                  onSelect={handleSiteSelect}
                  selectedValue={{
                    label: registerForm.site_name,
                    value: registerForm.site_id,
                    index: 0,
                  }}
                />
              )}
              {isTpoUser && <View style={styles.divider} />}
              <CustomDropDown
                label={i18next.t("label.intervention_type")}
                data={allIntervention}
                onSelect={handleInterventionType}
                selectedValue={{
                  label: registerForm.title,
                  value: registerForm.key,
                  index: 0
                }}
              />
              {registerForm.optionalLocation && registerForm.entire_site_selected === false ? <SelectionLocationType header={'Location Type'} labelOne={{
                key: 'Polygon',
                value: 'Polygon'
              }} labelTwo={{
                key: 'Point',
                value: 'Point'
              }} disabled={false}
                selectedValue={locationType}
                onSelect={setLocationType}
              /> : null}
              {registerForm.can_be_entire_site && isTpoUser && registerForm.site_id !== 'other' ? (
                <PlaceHolderSwitch
                  description={i18next.t("label.apply_intervention")}
                  selectHandler={handleEntireSiteArea}
                  value={registerForm.entire_site_selected}
                />
              ) : null}
              <InterventionDatePicker
                placeHolder={i18next.t("label.intervention_date")}
                value={registerForm.intervention_date || Date.now()}
                showPicker={toggleDatePicker}
              />
              <CustomTextInput
                label={i18next.t('label.location_optional')}
                onChangeHandler={(text: string) => {
                  formAnalytics.fieldChanged('location_name')
                  setLocationName(text)
                }}
                value={locationName}
              />
              <CustomTextInput
                label={i18next.t('label.further_info')}
                onChangeHandler={(text: string) => {
                  formAnalytics.fieldChanged('further_info')
                  setFurtherInfo(text)
                }}
                value={furtherInfo}
              />
            </View>
          </View>
        </AvoidSoftInputView>
      </ScrollView>
      <CustomButton
        label={i18next.t('label.continue')}
        pressHandler={pressContinue}
        containerStyle={styles.btnContainer}
        wrapperStyle={styles.btnWrapper}
        disable={!registerForm}
        hideFadeIn
      />
      <View style={styles.footer} />
    </SafeAreaView>
  )
}

export default InterventionFormView

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    height: '100%',
    width: '100%'
  },
  activityIndicator: {
    position: 'absolute',
    top: '40%',
    left: '49%'
  },
  wrapperScrollView: {
    flexGrow: 1,
    height: '100%',
    width: '100%'
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: Colors.BACKDROP_COLOR,
    height: '100%',
    width: '100%'
  },
  wrapper: {
    width: '98%',
    marginTop: 10,
    flex: 1,
    paddingBottom: 100,
    backgroundColor: Colors.BACKDROP_COLOR,
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    bottom: 20,
    marginBottom: 20,
    position: 'absolute',
  },
  btnWrapper: {
    width: '90%',
  },
  divider: {
    width: '90%',
    height: 1,
    backgroundColor: Colors.GRAY_LIGHT,
    marginBottom: 20,
    marginTop: 10,
    marginHorizontal: '5%',
  },
  footer: {
    position: 'absolute',
    height: 40,
    width: '100%',
    backgroundColor: Colors.BACKDROP_COLOR,
    bottom: 0
  }
})
