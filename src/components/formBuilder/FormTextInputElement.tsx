import {StyleSheet, View} from 'react-native'
import React from 'react'
import {FormElement} from 'src/types/interface/form.interface'
import {InputOutline} from 'react-native-input-outline'
import {Text} from 'react-native'
import {Colors} from 'src/utils/constants'

interface Props {
  data: FormElement
  formValues: {[key: string]: string}
}

const FormTextInputElement = (props: Props) => {
  const {data, formValues} = props
  const shouldRender = () => {
    let result = true
    if (data.condition !== null) {
      for (const [key, value] of Object.entries(data.condition)) {

        if (formValues[key] !== String(value)) {
          result = false
        }
      }
    }
    return result
  }

  if (!shouldRender()) {
    return null
  }

  return (
    <View style={styles.container}>
      <InputOutline
        style={styles.inputWrapper}
        keyboardType={data.keyboard_type}
        placeholder={data.placeholder}
        activeColor={Colors.PRIMARY}
        inactiveColor={Colors.GRAY_TEXT}
        placeholderTextColor={Colors.GRAY_TEXT}
        fontSize={18}
        trailingIcon={() => <Text style={styles.unitLabel}>{data.unit}</Text>}
      />
    </View>
  )
}

export default FormTextInputElement

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 50,
    alignItems: 'center',
    marginVertical: 20,
    flexDirection: 'row',
  },
  inputWrapper: {
    borderRadius: 10,
    paddingHorizontal: 10,
    width: '90%',
    height: '100%',
    marginHorizontal: '5%',
  },
  unitLabel: {
    color: Colors.GRAY_TEXT,
  },
})