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
import {
  extractSpecies,
} from 'src/utils/helpers/interventionFormHelper'
import { updateTree_details } from 'src/store/slice/registerFormSlice'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'

const AddMeasurment = () => {
  const SampleTreeData = useSelector((state: RootState) => state.sampleTree)
  const [height, setHeight] = useState('')
  const [width, setWidth] = useState('')
  const [tagEnable, setTagEnabled] = useState(false)
  const [tagId, setTagId] = useState('')

  const dispatch = useDispatch()
  // const [heightErrorMessage, setHeightErrorMessgae] = useState('')
  // const [widthErrorMessage, setWidthErrorMessage] = useState('')

  const formFlowData = useSelector((state: RootState) => state.formFlowState)
  const { lat, long } = useSelector(
    (state: RootState) => state.gpsState.user_location,
  )

  const { species_details, treeCount } = extractSpecies(SampleTreeData)

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const onSubmit = () => {
    if (formFlowData.form_details.length === 0) {
      submitDetails()
    }
  }

  const submitDetails = () => {
    const treeDetails: SampleTree = {
      tree_id: uuidv4(),
      species_guid: species_details.guid,
      intervention_id: formFlowData.form_id,
      count: treeCount,
      latitude: SampleTreeData.coordinates[0][1],
      longitude: SampleTreeData.coordinates[0][0],
      device_latitude: lat || 0,
      device_longitude: long || 0,
      location_accuracy: '',
      image_url: SampleTreeData.image_url,
      cdn_image_url: '',
      specie_name: species_details.scientific_name,
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
    }
    dispatch(updateTree_details(treeDetails))
    navigation.replace('ReviewTreeDetails', { detailsCompleted: true })
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header label="Add Measurment" />
      <View style={styles.wrapper}>
        <OutlinedTextInput
          placeholder={'Height'}
          changeHandler={setHeight}
          keyboardType={'numeric'}
          trailingtext={'m'}
        />
        <OutlinedTextInput
          placeholder={'Basal Diameter'}
          changeHandler={setWidth}
          keyboardType={'numeric'}
          trailingtext={'cm'}
        />
        <TagSwitch
          placeholder={'Tag Tree'}
          changeHandler={setTagId}
          keyboardType={'numeric'}
          trailingtext={''}
          switchEnable={tagEnable}
          description={'This tree has been tagged for identificaiton'}
          switchHandler={setTagEnabled}
        />
        <CustomButton
          label="Continue"
          containerStyle={styles.btnContainer}
          pressHandler={onSubmit}
        />
      </View>
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
