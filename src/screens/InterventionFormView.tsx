import {ActivityIndicator, StyleSheet, View} from 'react-native'
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

const InterventionFormView = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'InterventionForm'>>()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const userType = useSelector((state: RootState) => state.userState.type)
  const [loading, setLoading] = useState(false)

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
    if (userType === 'tpo' && formFlowData.skip_intervention_form) {
      formFlowData.project_name = currentProject.projectName
      formFlowData.project_id = currentProject.projectId
      formFlowData.site_name = projectSite.siteName
      formFlowData.site_id = projectSite.siteId
    }
    dispatch(initiateForm({...formFlowData}))
    if (formFlowData.skip_intervention_form) {
      if (formFlowData.location_type === 'Point') {
        navigation.replace('PointMarker')
      } else {
        navigation.replace('PolygonMarker')
      }
    } else {
      setLoading(false)
    }
  }

  const handleDropDownSelect = (data: {
    label: string
    value: string
    index: number
  }) => {
    console.log('kaljsc', data)
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={Colors.PRIMARY} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Header label="Itervention" />
      <View style={styles.wrapper}>
        <CustomDropDown
          label={'Project'}
          data={[]}
          onSelect={handleDropDownSelect}
          selectedValue={undefined}
        />
        <CustomDropDown
          label={'Site'}
          data={[]}
          onSelect={handleDropDownSelect}
          selectedValue={undefined}
        />
        <CustomDropDown
          label={'Intervention Type'}
          data={[]}
          onSelect={handleDropDownSelect}
          selectedValue={undefined}
        />
        <PlaceHolderSwitch description={'Apply Intervention to entire site'} />
        <CustomDropDown
          label={'Intervention Date'}
          data={[]}
          onSelect={handleDropDownSelect}
          selectedValue={undefined}
        />
        <CustomTextInput label={'Location name(Optional)'} />
        <CustomTextInput label={'Further Information(Optional)'} />
        <CustomButton
          label={'continue'}
          pressHandler={() => null}
          containerStyle={styles.btnContainer}
          wrapperStyle={styles.btnWrapper}
        />
      </View>
    </View>
  )
}

export default InterventionFormView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.GRAY_BACKDROP,
  },
  wrapper: {
    width: '95%',
    marginTop: 10,
    flex: 1,
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    position: 'absolute',
    bottom: 0,
  },
  btnWrapper: {
    width: '95%',
  },
})
