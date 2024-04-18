import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import React, {useEffect, useState} from 'react'
import Header from 'src/components/common/Header'
import CustomDropDown from 'src/components/common/CustomDropDown'
import {Colors} from 'src/utils/constants'
import CustomTextInput from 'src/components/common/CustomTextInput'
import CustomButton from 'src/components/common/CustomButton'
import {scaleSize} from 'src/utils/constants/mixins'
import PlaceHolderSwitch from 'src/components/common/PlaceHolderSwitch'
import {useRoute, RouteProp, useNavigation} from '@react-navigation/native'
import {StackNavigationProp} from '@react-navigation/stack'
import {useDispatch, useSelector} from 'react-redux'
import {
  initiateForm,
  updateCoverImageId,
} from 'src/store/slice/registerFormSlice'
import {RootStackParamList} from 'src/types/type/navigation.type'
import {setUpIntervention} from 'src/utils/helpers/formHelper/selectIntervention'
import {v4 as uuidv4} from 'uuid'
import {RootState} from 'src/store'
import {useRealm} from '@realm/react'
import {RealmSchema} from 'src/types/enum/db.enum'
import {ProjectInterface} from 'src/types/interface/app.interface'
import {INTERVENTION_TYPE} from 'src/types/type/app.type'
import {RegisterFormSliceInitalState} from 'src/types/interface/slice.interface'

interface DropdownData {
  label: string
  value: string
  index: number
}

const InterventionFormView = () => {
  const realm = useRealm()
  const route = useRoute<RouteProp<RootStackParamList, 'InterventionForm'>>()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const userType = useSelector((state: RootState) => state.userState.type)
  const [loading, setLoading] = useState(false)
  const [interventionForm, setInterventionFormData] =
    useState<RegisterFormSliceInitalState>(null)
  const InterventionData: Array<{
    label: string
    value: INTERVENTION_TYPE
    index: number
  }> = [
    {
      label: 'Fire Supression team',
      value: 'FIRESUPRESSION_TEAM',
      index: 0,
    },
    {
      label: 'Assisting Seed Rain',
      value: 'SEED_RAIN',
      index: 0,
    },
    {
      label: 'Removal of Invasive Species',
      value: 'REMOVAL_INVASIVE_SPEICES',
      index: 1,
    },
  ]

  const [projectStateData, setProjectData] = useState<any>([])
  const [projectSies, setProjectSites] = useState<any>([])
  const [entireSiteSelected, setEntireSiteSelected] = useState(false)
  const [locationName, setLocationName] = useState('')
  const [furtherInfo, setFurtherInfo] = useState('')

  const [interventionType, setInterventionType] = useState<{
    label: string
    value: INTERVENTION_TYPE
    index: number
  }>({
    label: 'UNKOWN',
    value: 'UNKOWN',
    index: 0,
  })
  const [selectedProject, setSelectedProject] = useState<DropdownData>({
    label: '',
    value: '',
    index: 0,
  })
  const [selectedProjectSite, setSelectedProjectSite] = useState<DropdownData>({
    label: '',
    value: '',
    index: 0,
  })
  const {currentProject, projectSite} = useSelector(
    (state: RootState) => state.projectState,
  )

  const dispatch = useDispatch()

  useEffect(() => {
    setUpRegisterFlow()
  }, [route.params])

  const setUpRegisterFlow = () => {
    const formFlowData = setUpIntervention(route.params.id)
    formFlowData.form_id = uuidv4()
    formFlowData.intervention_date = new Date().getTime()
    formFlowData.user_type = userType
    if (formFlowData.skip_intervention_form) {
      if (userType === 'tpo' && formFlowData.skip_intervention_form) {
        formFlowData.project_name = currentProject.projectName
        formFlowData.project_id = currentProject.projectId
        formFlowData.site_name = projectSite.siteName
        formFlowData.site_id = projectSite.siteId
      }
      dispatch(initiateForm({...formFlowData}))
      if (formFlowData.location_type === 'Point') {
        navigation.replace('PointMarker')
      } else {
        navigation.replace('PolygonMarker')
      }
    } else {
      setupProjectData()
      setLoading(false)
    }
  }

  const setupProjectData = () => {
    const projectData = realm.objects<ProjectInterface>(RealmSchema.Projects)
    const validatedData = projectData.map((el, i) => {
      return {
        label: el.name,
        value: el.id,
        index: i,
      }
    })
    if (validatedData) {
      setProjectData(validatedData)
      setSelectedProject(validatedData[0])
      const siteValidate = projectData[0].sites.map((el, i) => {
        return {
          label: el.name,
          value: el.id,
          index: i,
        }
      })
      setProjectSites(siteValidate)
      setSelectedProjectSite(siteValidate[0])
    }
  }

  const handleProjectSelect = (item: DropdownData) => {
    setSelectedProject(item)
    const projectData = realm.objects<ProjectInterface>(RealmSchema.Projects)
    const filtererdData = projectData.filter(el => el.id === item.value)
    const siteValidate = filtererdData[0].sites.map((el, i) => {
      return {
        label: el.name,
        value: el.id,
        index: i,
      }
    })
    setProjectSites(siteValidate)
    setSelectedProjectSite(siteValidate[0])
  }

  const handleInterventionType = (item: any) => {
    const result = setUpIntervention(item.value)
    setInterventionFormData(result)
    setInterventionType({
      label: item.label,
      value: item.value,
      index: 0,
    })
  }

  const pressContinue = () => {
    const formFlowData = setUpIntervention(interventionType.value)
    formFlowData.form_id = uuidv4()
    formFlowData.intervention_date = new Date().getTime()
    formFlowData.user_type = userType
    formFlowData.project_name = selectedProject.label
    formFlowData.project_id = selectedProject.value
    formFlowData.site_name = selectedProjectSite.label
    formFlowData.site_id = selectedProjectSite.value
    const metaData = {
      location_name: locationName,
      further_info: furtherInfo,
    }
    formFlowData.meta_data = JSON.stringify(metaData)
    if (entireSiteSelected) {
      const coords = siteCoordinatesSelect()
      formFlowData.coordinates = coords
      const imageId = String(new Date().getTime())
      dispatch(initiateForm({...formFlowData}))
      dispatch(updateCoverImageId(imageId))
      navigation.replace('TakePicture', {
        id: imageId,
        screen: 'POLYGON_REGISTER',
      })
      return
    }
    dispatch(initiateForm({...formFlowData}))
    if (formFlowData.location_type === 'Point') {
      navigation.replace('PointMarker')
    } else {
      navigation.replace('PolygonMarker')
    }
  }

  const siteCoordinatesSelect = () => {
    const projectData = realm.objects<ProjectInterface>(RealmSchema.Projects)
    const filtererdData = projectData.filter(
      el => el.id === selectedProject.value,
    )
    const currentSiteData = filtererdData[0].sites.filter(
      el => el.id === selectedProjectSite.value,
    )
    const parsedGeometry = JSON.parse(currentSiteData[0].geometry)
    const extractCoordinates = parsedGeometry.coordinates[0].map((el) => {
      return {
        lat: el[1],
        long: el[0],
      }
    })
    return extractCoordinates
  }

  const handleDropDownSelect = (data: {
    label: string
    value: string
    index: number
  }) => {
    console.log('handleDropDownSelect', data)
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={Colors.PRIMARY} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView>
        <View style={styles.container}>
          <Header label="Itervention" />
          <View style={styles.wrapper}>
            <CustomDropDown
              label={'Project'}
              data={projectStateData}
              onSelect={handleProjectSelect}
              selectedValue={selectedProject}
            />
            <CustomDropDown
              label={'Site'}
              data={projectSies}
              onSelect={handleDropDownSelect}
              selectedValue={selectedProjectSite}
            />
            <CustomDropDown
              label={'Intervention Type'}
              data={InterventionData}
              onSelect={handleInterventionType}
              selectedValue={interventionType}
            />
            {interventionForm && interventionForm.entire_site_intervention ? (
              <PlaceHolderSwitch
                description={'Apply Intervention to entire site'}
                selectHandler={setEntireSiteSelected}
                value={entireSiteSelected}
              />
            ) : null}
            <CustomTextInput
              label={'Location name(Optional)'}
              onChangeHandler={setLocationName}
            />
            <CustomTextInput
              label={'Further Information(Optional)'}
              onChangeHandler={setFurtherInfo}
            />
          </View>
        </View>
      </ScrollView>
      <CustomButton
        label={'continue'}
        pressHandler={pressContinue}
        containerStyle={styles.btnContainer}
        wrapperStyle={styles.btnWrapper}
      />
    </KeyboardAvoidingView>
  )
}

export default InterventionFormView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
  },
  wrapper: {
    width: '95%',
    marginTop: 10,
    flex: 1,
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    bottom: 0,
    marginBottom: 20,
  },
  btnWrapper: {
    width: '95%',
  },
})
