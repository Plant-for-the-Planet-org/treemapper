import {StyleSheet, View} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import OutlinedTextInput from 'src/components/common/OutlinedTextInput'
import TagSwitch from 'src/components/formBuilder/TagSwitch'
import CustomButton from 'src/components/common/CustomButton'
import {scaleSize} from 'src/utils/constants/mixins'

const AddMeasurment = () => {
  return (
    <View style={styles.container}>
      <Header label="Add Measurment" />
      <View style={styles.wrapper}>
        <OutlinedTextInput
          placeholder={'Height'}
          changeHandler={function (): void {
            throw new Error('Function not implemented.')
          }}
          keyboardType={'numeric'}
          trailingtext={'m'}
        />
        <OutlinedTextInput
          placeholder={'Basal Diameter'}
          changeHandler={function (): void {
            throw new Error('Function not implemented.')
          }}
          keyboardType={'numeric'}
          trailingtext={'cm'}
        />
        <TagSwitch
          placeholder={'Tag Tree'}
          changeHandler={function (): void {
            throw new Error('Function not implemented.')
          }}
          keyboardType={'numeric'}
          trailingtext={''}
          switchEnable={true}
          description={'This tree has been tagged for identificaiton'}
          switchHandler={function (): void {
            throw new Error('Function not implemented.')
          }}
        />
        <CustomButton
          label="Continue"
          containerStyle={styles.btnContainer}
          pressHandler={null}
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
    flex:1
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    position: 'absolute',
    bottom: 0,
  },
})
