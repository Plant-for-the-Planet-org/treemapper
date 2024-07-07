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
import { useSelector } from 'react-redux'
import { AvoidSoftInput, AvoidSoftInputView } from "react-native-avoid-softinput";
import { RootStackParamList } from 'src/types/type/navigation.type'
import { setUpIntervention } from 'src/utils/helpers/formHelper/selectIntervention'
import { v4 as uuidv4 } from 'uuid'
import { RootState } from 'src/store'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { DropdownData, ProjectInterface } from 'src/types/interface/app.interface'
import InterventionDatePicker from 'src/components/formBuilder/InterventionDatePicker'
import { AllIntervention } from 'src/utils/constants/knownIntervention'
import { INTERVENTION_TYPE } from 'src/types/type/app.type'
import { SafeAreaView } from 'react-native-safe-area-context'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { makeInterventionGeoJson, metaDataTranformer } from 'src/utils/helpers/interventionFormHelper'
import { getDeviceDetails } from 'src/utils/helpers/appHelper/getAddtionalData'
import { createBasePath } from 'src/utils/helpers/fileManagementHelper'
import SelectionLocationType from 'src/components/intervention/SelectLocationType'
import { useToast } from 'react-native-toast-notifications'
import { errotHaptic } from 'src/utils/helpers/hapticFeedbackHelper'
import useLogManagement from 'src/hooks/realm/useLogManagement'
import { RegisterFormSliceInitalState } from 'src/types/interface/slice.interface'

const InterventionFormView = () => {
  const [projectStateData, setProjectData] = useState<DropdownData[]>([])
  const [projectSies, setProjectSites] = useState<DropdownData[]>([])
  const [locationName, setLocationName] = useState('')
  const [furtherInfo, setFurtherInfo] = useState('')
  const [allIntervention] = useState([...AllIntervention.filter(el => el.value !== 'single-tree-registration' && el.value !== 'multi-tree-registration')])
  const [locationType, setLocationType] = useState<'Polygon' | 'Point'>('Polygon')
  const [registerForm, setRegisterForm] = useState<RegisterFormSliceInitalState | null>(null)
  const userType = useSelector((state: RootState) => state.userState.type)
  const { addNewLog } = useLogManagement()
  const { currentProject, projectSite } = useSelector(
    (state: RootState) => state.projectState,
  )

  const { initializeIntervention, updateInterventionLocation } = useInterventionManagement()

  const realm = useRealm()
  const route = useRoute<RouteProp<RootStackParamList, 'InterventionForm'>>()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const toast = useToast()
  const isTpoUser = userType === 'tpo'
  const paramId = route.params ? route.params.id : ''

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
        message: "Error Occured while creating root folder",
        logLevel: 'error',
        statusCode: '',
        logStack: result.msg
      })
      errotHaptic()
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
      handleInterventionType({ label: "Fencing", value: 'fencing', index: 0 })
      if (isTpoUser) {
        setupProjectAndSiteDropDown()
      }
    }
  }

  const skipForm = async (
    key: INTERVENTION_TYPE,
  ) => {
    const InterventionJSON = { ...setUpIntervention(key) }
    InterventionJSON.form_id = uuidv4()
    InterventionJSON.intervention_date = new Date().getTime()
    InterventionJSON.user_type = userType
    const existingMetaData = JSON.parse(InterventionJSON.meta_data);
    const appMeta = getDeviceDetails()
    const finalMetaData = metaDataTranformer(existingMetaData, {
      public: {},
      private: {},
      app: appMeta
    })
    InterventionJSON.meta_data = finalMetaData
    InterventionJSON.project_name = currentProject.projectName
    InterventionJSON.project_id = currentProject.projectId
    InterventionJSON.site_name = projectSite.siteName
    InterventionJSON.site_id = projectSite.siteId
    const result = await initializeIntervention(InterventionJSON)
    if (result) {
      if (InterventionJSON.location_type === 'Point') {
        navigation.replace('PointMarker', { id: InterventionJSON.form_id })
      } else {
        navigation.replace('PolygonMarker', { id: InterventionJSON.form_id })
      }
    } else {
      toast.show("Error occured while adding intervention")
      errotHaptic()
    }
  }

  const setupProjectAndSiteDropDown = () => {
    const projectData = realm.objects<ProjectInterface>(RealmSchema.Projects)
    const mapedData = projectData.map((el, i) => {
      return {
        label: el.name,
        value: el.id,
        index: i,
      }
    })
    if (mapedData && mapedData.length) {
      setProjectData(mapedData)
      const siteMapedData = projectData[0].sites.map((el, i) => {
        return {
          label: el.name,
          value: el.id,
          index: i,
        }
      })
      setProjectSites(siteMapedData)
      handleProjectSelect({ label: currentProject.projectName, value: currentProject.projectId, index: 0 })
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
      setProjectSites(siteValidate)
      setRegisterForm(prevState => ({ ...prevState, project_id: ProjectData.id, project_name: ProjectData.name, site_name: siteValidate[0].label, site_id: siteValidate[0].value }))
    } else {
      setProjectSites([
        {
          label: 'Project has no site',
          value: '',
          index: 0,
        },
      ])
      setRegisterForm(prevState => ({ ...prevState, project_id: ProjectData.id, project_name: ProjectData.name, site_name: siteValidate[0].label, site_id: siteValidate[0].value }))
    }
  }

  const handleSiteSelect = (item: DropdownData) => {
    if (item.value) {
      setRegisterForm({
        ...registerForm, site_name: item.label, site_id: item.value
      })
    }
  }

  const handleInterventionType = (item: any) => {
    const InterventionJSON = setUpIntervention(item.value)
    InterventionJSON.form_id = uuidv4()
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
    setRegisterForm(prevstate => ({ ...prevstate, intervention_date: n }))
  }

  const handleEntireSiteArea = (b: boolean) => {
    setRegisterForm(prevstate => ({ ...prevstate, entire_site_selected: b }))
  }

  const siteCoordinatesSelect = () => {
    const ProjectData = realm.objectForPrimaryKey<ProjectInterface>(
      RealmSchema.Projects,
      registerForm.project_id,
    )
    const currentSiteData = ProjectData.sites.filter(
      el => el.id === registerForm.site_id,
    )
    const parsedGeometry = JSON.parse(currentSiteData[0].geometry)
    return parsedGeometry.coordinates[0]
  }

  const pressContinue = async () => {
    if (registerForm.entire_site_selected) {
      registerForm.coordinates = siteCoordinatesSelect()
    }

    if (registerForm.optionalLocation) {
      registerForm.location_type = locationType
    }

    const metaData = {}
    if (locationName && locationName.length > 0) {
      metaData["Location Name"] = locationName
    }
    if (furtherInfo && furtherInfo.length > 0) {
      metaData["Info"] = furtherInfo
    }
    const existingMetaData = JSON.parse(registerForm.meta_data);
    const appMeta = getDeviceDetails()
    const finalMetaData = metaDataTranformer(existingMetaData, {
      public: metaData,
      private: {},
      app: appMeta
    })
    registerForm.meta_data = finalMetaData
    const result = await initializeIntervention(registerForm)
    if (result) {
      if (registerForm.entire_site_selected) {
        const { coordinates, } = makeInterventionGeoJson(registerForm.location_type, siteCoordinatesSelect(), registerForm.form_id, '')
        const locationUpdated = await updateInterventionLocation(registerForm.form_id, { type: 'Polygon', coordinates: coordinates }, true)
        if (!locationUpdated) {
          errotHaptic()
          toast.show("Error occured while updating location")
          return
        }
        if (registerForm.species_required) {
          navigation.replace('ManageSpecies', { manageSpecies: false, id: registerForm.form_id })
        } else if (registerForm.form_details.length > 0) {
          navigation.replace('LocalForm', { id: registerForm.form_id })
        } else {
          navigation.replace('InterventionPreview', { id: 'review', intervention: '', interventionId: registerForm.form_id })
        }
        return
      }
      if (registerForm.location_type === 'Point') {
        navigation.replace('PointMarker', { id: registerForm.form_id })
      } else {
        navigation.replace('PolygonMarker', { id: registerForm.form_id })
      }
    } else {
      addNewLog({
        logType: 'INTERVENTION',
        message: 'Error occured while creating intervention',
        logLevel: 'error',
        statusCode: ''
      })
      toast.show("Error occured while creating intervention")
      errotHaptic()
    }
  }



  if (!registerForm) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={Colors.PRIMARY} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <AvoidSoftInputView
        avoidOffset={20}
        style={styles.container}>
        <ScrollView>
          <View style={styles.container}>
            <Header label="Intervention" />
            <View style={styles.wrapper}>
              {isTpoUser && (
                <CustomDropDown
                  label={'Project'}
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
                  label={'Site'}
                  data={projectSies}
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
                label={'Intervention Type'}
                data={allIntervention}
                onSelect={handleInterventionType}
                selectedValue={{
                  label: registerForm.title,
                  value: registerForm.key,
                  index: 0
                }}
              />
              {registerForm.optionalLocation && <SelectionLocationType header={'Location Type'} labelOne={{
                key: 'Polygon',
                value: 'Polygon'
              }} labelTwo={{
                key: 'Point',
                value: 'Point'
              }} disabled={false}
                selectedValue={locationType}
                onSelect={setLocationType}
              />}
              {registerForm.can_be_entire_site && isTpoUser ? (
                <PlaceHolderSwitch
                  description={'Apply Intervention to entire site'}
                  selectHandler={handleEntireSiteArea}
                  value={registerForm.entire_site_selected}
                />
              ) : null}
              <InterventionDatePicker
                placeHolder={'Intervention Date'}
                value={registerForm.intervention_date || Date.now()}
                callBack={handleDateSelection}
              />
              <CustomTextInput
                label={'Location Name [Optional]'}
                onChangeHandler={setLocationName}
                value={locationName}
              />
              <CustomTextInput
                label={'Further Information [Optional]'}
                onChangeHandler={setFurtherInfo}
                value={furtherInfo}
              />
            </View>
          </View>
        </ScrollView>
        <CustomButton
          label={'Continue'}
          pressHandler={pressContinue}
          containerStyle={styles.btnContainer}
          wrapperStyle={styles.btnWrapper}
          disable={!registerForm}
        />
      </AvoidSoftInputView>
    </SafeAreaView>
  )
}

export default InterventionFormView

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.BACKDROP_COLOR,
  },
  wrapper: {
    width: '98%',
    marginTop: 10,
    flex: 1,
    paddingBottom: 50
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    bottom: 0,
    marginBottom: 20,
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
})
