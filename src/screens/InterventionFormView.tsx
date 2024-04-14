import {ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View} from 'react-native'
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
import {initiateForm} from 'src/store/slice/registerFormSlice'
import {RootStackParamList} from 'src/types/type/navigation.type'
import {setUpIntervention} from 'src/utils/formHelper/selectIntervention'
import {v4 as uuidv4} from 'uuid'
import {RootState} from 'src/store'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { ProjectInterface } from 'src/types/interface/app.interface'
import { INTERVENTION_TYPE } from 'src/types/type/app.type'

const InterventionFormView = () => {
  const realm = useRealm()
  const route = useRoute<RouteProp<RootStackParamList, 'InterventionForm'>>()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const userType = useSelector((state: RootState) => state.userState.type)
  const [loading, setLoading] = useState(false)

const InterventionData:Array<{
  label: string,
    value: INTERVENTION_TYPE,
    index: number
}>=[
  {
    label: 'Fire Supression team',
    value: 'FIRESUPRESSION_TEAM',
    index: 0
  },
  {
    label: 'Assisting Seed Rain',
    value: 'SEED_RAIN',
    index: 0
  },
  {
    label: 'Removal of Invasive Species',
    value: 'REMOVAL_INVASIVE_SPEICES',
    index: 1
  },
]


  const [projectStateData, setProjectData] = useState<any>([])
  const [projectSies, setProjectSites] = useState<any>([])
  const [interventionType, setInterventionType] = useState<{
    label: string,
      value: INTERVENTION_TYPE,
      index: number
  }>({
    label:'UNKOWN',
    value:'UNKOWN',
    index:0
  })
  const [selectedProject, setSelectedProject] = useState<{
    label: string
    value: string
    index: number
  }>({
    label: '',
    value: '',
    index: 0,
  })
  const [selectedProjectSite] = useState<{
    label: string
    value: string
    index: number
  }>({
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

  const setupProjectData=()=>{
    const projectData = realm.objects<ProjectInterface>(RealmSchema.Projects);
    const validatedData = projectData.map((el, i) => {
      return {
        label: el.name,
        value: el.id,
        index: i,
      }
    })
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
  }

  const handleInterventionType=(item:any)=>{
    setInterventionType({
      label:item.label,
      value: item.value,
      index:0})
  }

  const pressContinue=()=>{
    const formFlowData = setUpIntervention(interventionType.value)
    formFlowData.form_id = uuidv4()
    formFlowData.intervention_date = new Date().getTime()
    formFlowData.user_type = userType
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
          onSelect={handleDropDownSelect}
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
        <PlaceHolderSwitch description={'Apply Intervention to entire site'} />
        {/* <CustomDropDown
          label={'Intervention Date'}
          data={[]}
          onSelect={handleDropDownSelect}
          selectedValue={undefined}
        /> */}
        <CustomTextInput label={'Location name(Optional)'} />
        <CustomTextInput label={'Further Information(Optional)'} />
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
    marginBottom:20
  },
  btnWrapper: {
    width: '95%',
  },
})
