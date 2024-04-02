import {StyleSheet, View} from 'react-native'
import React from 'react'
import {InputOutline} from 'react-native-input-outline'
import {Colors} from 'src/utils/constants'

interface Props {
  label: string
}

const CustomTextInput = (props: Props) => {
  const {label} = props

  return (
    <View style={styles.container}>
      <InputOutline
        style={styles.inputWrapper}
        placeholder={label}
        activeColor={Colors.PRIMARY}
        inactiveColor={Colors.GRAY_TEXT}
        placeholderTextColor={Colors.GRAY_TEXT}
        fontSize={16}
        backgroundColor={Colors.GRAY_BACKDROP}
      />
    </View>
  )
}

export default CustomTextInput

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 50,
    alignItems: 'center',
    marginVertical: 20,
    flexDirection: 'row',
    backgroundColor: Colors.GRAY_BACKDROP,
  },
  inputWrapper: {
    borderRadius: 10,
    paddingHorizontal: 10,
    width: '90%',
    height: '100%',
    marginHorizontal: '5%',
    backgroundColor: Colors.GRAY_BACKDROP,
  },
  unitLabel: {
    color: Colors.GRAY_TEXT,
  },
})
