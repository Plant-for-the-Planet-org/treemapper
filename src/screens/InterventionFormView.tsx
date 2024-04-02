import {StyleSheet, View} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import CustomDropDown from 'src/components/common/CustomDropDown'
import {Colors} from 'src/utils/constants'
import CustomTextInput from 'src/components/common/CustomTextInput'
import CustomButton from 'src/components/common/CustomButton'
import {scaleSize} from 'src/utils/constants/mixins'
import PlaceHolderSwitch from 'src/components/common/PlaceHolderSwitch'

const InterventionFormView = () => {
  return (
    <View style={styles.container}>
      <Header label="Itervention" />
      <View style={styles.wrapper}>
        <CustomDropDown label={'Project'} />
        <CustomDropDown label={'Site'} />
        <CustomDropDown label={'Intervention Type'} />
        <PlaceHolderSwitch description={'Apply Intervention to entire site'} />
        <CustomDropDown label={'Intervention Date'} />
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
