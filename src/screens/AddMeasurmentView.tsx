import {StyleSheet, View} from 'react-native'
import React, {useState} from 'react'
import Header from 'src/components/common/Header'
import OutlinedTextInput from 'src/components/common/OutlinedTextInput'
import TagSwitch from 'src/components/formBuilder/TagSwitch'
import CustomButton from 'src/components/common/CustomButton'
import {scaleSize} from 'src/utils/constants/mixins'
import {RootState} from 'src/store'
import {useSelector} from 'react-redux'
import {useNavigation} from '@react-navigation/native'
import {StackNavigationProp} from '@react-navigation/stack'
import {RootStackParamList} from 'src/types/type/navigation.type'

const AddMeasurment = () => {
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [tagEnable, setTagEnabled] = useState(false)
  const [tagId, setTagId] = useState('')
  const formFlowData = useSelector((state: RootState) => state.formFlowState)
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const onSubmit = () => {
    if (formFlowData.form_details.length === 0) {
      console.log('formdata', height, weight, tagEnable, tagId)
      navigation.navigate('PreviewFormData')
    }
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
          changeHandler={setWeight}
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
