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
import {
  initiateForm,
  resetRegisterationForm,
  updateEntireSiteIntervention,
  updateFormProject,
  updateFormProjectSite,
  updteInterventionDate,
} from 'src/store/slice/registerFormSlice'
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
import { resetSampleTreeform } from 'src/store/slice/sampleTreeSlice'
import { updateNewIntervention } from 'src/store/slice/appStateSlice'
import { getDeviceDetails } from 'src/utils/helpers/appHelper/getAddtionalData'
import { createBasePath } from 'src/utils/helpers/fileManagementHelper'

const InterventionFormView = () => {
  const realm = useRealm()
  const dispatch = useDispatch()
  const route = useRoute<RouteProp<RootStackParamList, 'InterventionForm'>>()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const userType = useSelector((state: RootState) => state.userState.type)
  const InterventionFormData = useSelector(
    (state: RootState) => state.formFlowState,
  )
  const { currentProject, projectSite } = useSelector(
    (state: RootState) => state.projectState,
  )
  const { initializeIntervention, updateInterventionLocation } = useInterventionManagement()
  const [loading, setLoading] = useState(true)
  const [projectStateData, setProjectData] = useState<any>([])
  const [projectSies, setProjectSites] = useState<any>([])
  const [locationName, setLocationName] = useState('')
  const [furtherInfo, setFurtherInfo] = useState('')
  const [allIntervention] = useState([...AllIntervention.filter(el => el.value !== 'single-tree-registration' && el.value !== 'multi-tree-registration')])
  const [interventionType, setInterventionType] = useState<DropdownData>({
    label: '',
    value: '',
    index: 0,
  })

  const isTpoUser = userType === 'tpo'
  const paramId = route.params ? route.params.id : ''

  useEffect(() => {
    dispatch(resetRegisterationForm())
    dispatch(resetSampleTreeform())
    setUpRegisterFlow()
  }, [])

  useEffect(() => {
    // This should be run when screen gains focus - enable the module where it's needed
    AvoidSoftInput.setShouldMimicIOSBehavior(true);
    return () => {
      // This should be run when screen loses focus - disable the module where it's not needed, to make a cleanup
      AvoidSoftInput.setShouldMimicIOSBehavior(false);
    };
  })

  const setUpRegisterFlow = async () => {
    await createBasePath()
    if (paramId) {
      disptachFormDetails(paramId, true, true)
    } else {
      if (isTpoUser) {
        setupProjectAndSiteDropDown()
      }
      setLoading(false)
    }
  }

  const disptachFormDetails = async (
    key: INTERVENTION_TYPE,
    skip: boolean,
    defaultProject: boolean,
  ) => {
    const InterventionJSON = setUpIntervention(key)
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
    if (defaultProject) {
      InterventionJSON.project_name = currentProject.projectName
      InterventionJSON.project_id = currentProject.projectId
      InterventionJSON.site_name = projectSite.siteName
      InterventionJSON.site_id = projectSite.siteId
    } else {
      InterventionJSON.project_name = InterventionFormData.project_name
      InterventionJSON.project_id = InterventionFormData.project_id
      InterventionJSON.site_name = InterventionFormData.site_name
      InterventionJSON.site_id = InterventionFormData.site_id
    }
    dispatch(initiateForm({ ...InterventionJSON }))
    await initializeIntervention(InterventionJSON)
    dispatch(updateNewIntervention())
    if (skip && InterventionJSON.skip_intervention_form) {
      if (InterventionJSON.location_type === 'Point') {
        navigation.replace('PointMarker')
      } else {
        navigation.replace('PolygonMarker')
      }
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
      dispatch(
        updateFormProject({ name: mapedData[0].label, id: mapedData[0].value }),
      )
      dispatch(
        updateFormProjectSite({
          name: siteMapedData[0].label,
          id: siteMapedData[0].value,
        }),
      )
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
    dispatch(updateFormProject({ name: ProjectData.name, id: ProjectData.id }))
    if (siteValidate && siteValidate.length > 0) {
      setProjectSites(siteValidate)
      dispatch(
        updateFormProjectSite({
          name: siteValidate[0].label,
          id: siteValidate[0].value,
        }),
      )
    } else {
      setProjectSites([
        {
          label: 'Project has no site',
          value: '',
          index: 0,
        },
      ])
      dispatch(
        updateFormProjectSite({
          name: '',
          id: '',
        }),
      )
    }
  }

  const handleSiteSelect = (item: DropdownData) => {
    if (item.value) {
      dispatch(
        updateFormProjectSite({
          name: item.label,
          id: item.value,
        }),
      )
    }
  }

  const handleInterventionType = (item: any) => {
    disptachFormDetails(item.value, false, false)
    setInterventionType(item)
  }

  const pressContinue = async () => {
    const finalData = { ...InterventionFormData }
    if (InterventionFormData.entire_site_selected) {
      finalData.coordinates = siteCoordinatesSelect()
    }

    const metaData = {}
    if (locationName && locationName.length > 0) {
      metaData["Location Name"] = locationName
    }
    if (furtherInfo && furtherInfo.length > 0) {
      metaData["Info"] = furtherInfo
    }
    const existingMetaData = JSON.parse(finalData.meta_data);
    const appMeta = getDeviceDetails()
    const finalMetaData = metaDataTranformer(existingMetaData, {
      public: metaData,
      private: {},
      app: appMeta
    })
    finalData.meta_data = finalMetaData
    dispatch(initiateForm({ ...finalData }))
    await initializeIntervention(finalData)
    dispatch(updateNewIntervention())
    if (finalData.entire_site_selected) {
      const { coordinates, } = makeInterventionGeoJson(finalData.location_type, siteCoordinatesSelect(), finalData.form_id, '')
      await updateInterventionLocation(finalData.form_id, { type: 'Polygon', coordinates: coordinates }, true)
      if (finalData.species_required) {
        navigation.replace('ManageSpecies', { manageSpecies: false })
      } else if (finalData.form_details.length > 0) {
        navigation.replace('LocalForm')
      } else {
        navigation.replace('InterventionPreview', { id: 'review', intervention: '' })
      }
      return
    }

    if (finalData.location_type === 'Point') {
      navigation.replace('PointMarker')
    } else {
      navigation.replace('PolygonMarker')
    }
  }

  const siteCoordinatesSelect = () => {
    const ProjectData = realm.objectForPrimaryKey<ProjectInterface>(
      RealmSchema.Projects,
      InterventionFormData.project_id,
    )
    const currentSiteData = ProjectData.sites.filter(
      el => el.id === InterventionFormData.site_id,
    )
    const parsedGeometry = JSON.parse(currentSiteData[0].geometry)
    return parsedGeometry.coordinates[0]
  }

  const handleDateSelection = (n: number) => {
    dispatch(updteInterventionDate(n))
  }

  const handleEntireSiteArea = (b: boolean) => {
    dispatch(updateEntireSiteIntervention(b))
  }



  if (loading) {
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
                    label: InterventionFormData.project_name,
                    value: InterventionFormData.project_id,
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
                    label: InterventionFormData.site_name,
                    value: InterventionFormData.site_id,
                    index: 0,
                  }}
                />
              )}
              {isTpoUser && <View style={styles.divider} />}
              <CustomDropDown
                label={'Intervention Type'}
                data={allIntervention}
                onSelect={handleInterventionType}
                selectedValue={interventionType}
              />
              {InterventionFormData.can_be_entire_site && isTpoUser ? (
                <PlaceHolderSwitch
                  description={'Apply Intervention to entire site'}
                  selectHandler={handleEntireSiteArea}
                  value={InterventionFormData.entire_site_selected}
                />
              ) : null}
              <InterventionDatePicker
                placeHolder={'Intervention Date'}
                value={InterventionFormData.intervention_date || Date.now()}
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
          disable={interventionType.value === ''}
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
    paddingBottom:50
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
