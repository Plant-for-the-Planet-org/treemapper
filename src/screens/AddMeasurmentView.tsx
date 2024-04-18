import {StyleSheet, View} from 'react-native'
import React, {useState} from 'react'
import Header from 'src/components/common/Header'
import OutlinedTextInput from 'src/components/common/OutlinedTextInput'
import TagSwitch from 'src/components/formBuilder/TagSwitch'
import CustomButton from 'src/components/common/CustomButton'
import {scaleSize} from 'src/utils/constants/mixins'
import {RootState} from 'src/store'
import {useDispatch, useSelector} from 'react-redux'
import {useNavigation} from '@react-navigation/native'
import {StackNavigationProp} from '@react-navigation/stack'
import {RootStackParamList} from 'src/types/type/navigation.type'
import {SampleTree} from 'src/types/interface/slice.interface'
import {v4 as uuidv4} from 'uuid'
import {
  extractCoverImageUrl,
  extractSpecies,
  extractTreeCount,
  extractTreeImageUrl,
} from 'src/utils/helpers/interventionFormHelper'
import {useRealm} from '@realm/react'
import {RealmSchema} from 'src/types/enum/db.enum'
import {IScientificSpecies} from 'src/types/interface/app.interface'
import {updateTree_details} from 'src/store/slice/registerFormSlice'

const AddMeasurment = () => {
  const SampleTreeData = useSelector((state: RootState) => state.sampleTree)
  const is_sampleTree = SampleTreeData.form_id.length > 0
  const [height, setHeight] = useState('')
  const [width, setWidth] = useState('')
  const [tagEnable, setTagEnabled] = useState(false)
  const [tagId, setTagId] = useState('')

  const realm = useRealm()
  const dispatch = useDispatch()
  // const [heightErrorMessage, setHeightErrorMessgae] = useState('')
  // const [widthErrorMessage, setWidthErrorMessage] = useState('')

  const formFlowData = useSelector((state: RootState) => state.formFlowState)
  const {lat, long} = useSelector(
    (state: RootState) => state.gpsState.user_location,
  )
  const species_guid = extractSpecies(
    formFlowData,
    is_sampleTree ? SampleTreeData.current_species : '',
  )
  const speciesDetails = realm.objectForPrimaryKey<IScientificSpecies>(
    RealmSchema.ScientificSpecies,
    species_guid,
  )
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const onSubmit = () => {
    if (formFlowData.form_details.length === 0) {
      submitDetails()
    }
  }

  const submitDetails = () => {
    const treeDetails: SampleTree = {
      tree_id: uuidv4(),
      species_guid: speciesDetails.guid,
      intervention_id: formFlowData.form_id,
      count: is_sampleTree
        ? extractTreeCount(SampleTreeData, speciesDetails.guid)
        : 1,
      latitude: is_sampleTree
        ? SampleTreeData.coordinates[0].lat
        : formFlowData.coordinates[0].lat,
      longitude: is_sampleTree
        ? SampleTreeData.coordinates[0].long
        : formFlowData.coordinates[0].long,
      device_latitude: lat || 0,
      device_longitude: long || 0,
      location_accuracy: '',
      image_url: extractTreeImageUrl(formFlowData, SampleTreeData),
      cdn_image_url: extractCoverImageUrl(formFlowData, SampleTreeData),
      specie_name: speciesDetails.scientific_name,
      specie_diameter: Number(width),
      specie_height: Number(height),
      tag_id: tagId,
      plantation_date: new Date().getTime(),
      status_complete: false,
      location_id: '',
      tree_type: is_sampleTree ? 'sample' : 'single',
      additional_details: '',
      app_meta_data: '',
      hid: '',
    }
    dispatch(updateTree_details(treeDetails))
    navigation.replace('InterventionPreview', {id: 'review'})
  }

  return (
    <View style={styles.container}>
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
    </View>
  )
}

export default AddMeasurment

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
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
