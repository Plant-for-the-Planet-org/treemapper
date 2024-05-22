import { StyleSheet, View } from 'react-native'
import React, { useState } from 'react'
import Header from 'src/components/common/Header'
import OutlinedTextInput from 'src/components/common/OutlinedTextInput'
import TagSwitch from 'src/components/formBuilder/TagSwitch'
import CustomButton from 'src/components/common/CustomButton'
import { scaleSize } from 'src/utils/constants/mixins'
import { RootState } from 'src/store'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { SampleTree } from 'src/types/interface/slice.interface'
import { v4 as uuidv4 } from 'uuid'
import { updateTree_details } from 'src/store/slice/registerFormSlice'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import { validateNumber } from 'src/utils/helpers/formHelper/validationHelper'
import getUserLocation from 'src/utils/helpers/getUserLocation'
import { diameterValidation } from 'src/utils/constants/measurmentValidation'
import i18next from 'i18next'
import AlertModal from 'src/components/common/AlertModal'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'

const AddMeasurment = () => {
  const SampleTreeData = useSelector((state: RootState) => state.sampleTree)
  const [showOptimalAlert, setOptimalAlert] = useState(false)
  const [height, setHeight] = useState('')
  const [width, setWidth] = useState('')
  const [tagEnable, setTagEnabled] = useState(false)
  const [tagId, setTagId] = useState('')
  const { addSampleTrees } = useInterventionManagement()

  const dispatch = useDispatch()
  const [heightErrorMessage, setHeightErrorMessgae] = useState('')
  const [widthErrorMessage, setWidthErrorMessage] = useState('')
  const [tagIdErrorMessage, settagIdErrorMessage] = useState('')
  const formFlowData = useSelector((state: RootState) => state.formFlowState)
  const id = uuidv4()

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const onSubmit = () => {
    const heightValidation = validateNumber(height, 'Height', 'height')
    const widthValidation = validateNumber(width, 'Diameter', 'width')
    if (heightValidation.hasError || widthValidation.errorMessage) {
      setHeightErrorMessgae(heightValidation.errorMessage)
      setWidthErrorMessage(widthValidation.errorMessage)
      return;
    }
    if (tagEnable && tagId.length === 0) {
      settagIdErrorMessage('Tag Id can not be empty')
      return
    }
    const diameterError = diameterValidation(width, false)
    if (diameterError) {
      setOptimalAlert(true)
    } else {
      submitDetails();
    }
  }


  const handleOptimalalert = (p: boolean) => {
    if (p) {
      setOptimalAlert(false)
    } else {
      submitDetails();
    }
  }


  const submitDetails = async () => {
    const { lat, long, accuracy } = await getUserLocation()
    const treeDetails: SampleTree = {
      tree_id: id,
      species_guid: SampleTreeData.current_species.guid,
      intervention_id: formFlowData.form_id,
      count: SampleTreeData.current_species.count,
      latitude: SampleTreeData.coordinates[0][1],
      longitude: SampleTreeData.coordinates[0][0],
      device_latitude: lat ? lat : 0,
      device_longitude: long ? long : 0,
      location_accuracy: String(accuracy),
      image_url: SampleTreeData.image_url,
      cdn_image_url: '',
      specie_name: SampleTreeData.current_species.scientific_name,
      specie_diameter: Number(width),
      specie_height: Number(height),
      tag_id: tagId,
      plantation_date: new Date().getTime(),
      status_complete: true,
      location_id: '',
      tree_type: formFlowData.has_sample_trees ? 'sample' : 'single',
      additional_details: '',
      app_meta_data: '',
      hid: '',
      local_name: SampleTreeData.current_species.aliases,
    }
    const filterdData = formFlowData.tree_details.filter(el => el.tree_id !== treeDetails.tree_id)
    dispatch(updateTree_details([...filterdData, treeDetails]))
    await addSampleTrees(formFlowData.form_id, treeDetails)
    navigation.navigate('ReviewTreeDetails', { detailsCompleted: true })
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header label="Add Measurment" />
      <View style={styles.wrapper}>
        <OutlinedTextInput
          placeholder={'Height'}
          changeHandler={setHeight}
          keyboardType={'numeric'}
          trailingtext={'m'} errMsg={heightErrorMessage} />
        <OutlinedTextInput
          placeholder={'Basal Diameter'}
          changeHandler={setWidth}
          keyboardType={'numeric'}
          trailingtext={'cm'} errMsg={widthErrorMessage}
        />
        <TagSwitch
          placeholder={'Tag Tree'}
          changeHandler={setTagId}
          keyboardType={'default'}
          trailingtext={''}
          switchEnable={tagEnable}
          description={'This tree has been tagged for identificaiton'}
          switchHandler={setTagEnabled}
          errMsg={tagIdErrorMessage}
        />
        <CustomButton
          label="Continue"
          containerStyle={styles.btnContainer}
          pressHandler={onSubmit}
        />
      </View>
      <AlertModal
        showSecondaryButton
        visible={showOptimalAlert}
        onPressPrimaryBtn={handleOptimalalert}
        onPressSecondaryBtn={handleOptimalalert}
        heading={i18next.t('label.not_optimal_ratio')}
        secondaryBtnText={i18next.t('label.continue')}
        primaryBtnText={i18next.t('label.check_again')}
        message={i18next.t('label.not_optimal_ratio_message')}
      />
    </SafeAreaView>
  )
}

export default AddMeasurment

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.WHITE
  },
  wrapper: {
    width: '95%',
    flex: 1,
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    position: 'absolute',
    bottom: 0,
  },
})
