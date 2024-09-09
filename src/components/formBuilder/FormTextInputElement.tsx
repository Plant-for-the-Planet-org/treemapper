import { StyleSheet, View, Text } from 'react-native'
import React from 'react'
import { FormElement } from 'src/types/interface/form.interface'
import { InputOutline } from 'react-native-input-outline'
import { Colors, Typography } from 'src/utils/constants'

interface Props {
  data: FormElement
  formValues: { [key: string]: any }
  changeHandler: (key: string, value: string) => void
}

const FormTextInputElement = (props: Props) => {
  const { data, formValues, changeHandler } = props
  const shouldRender = () => {
    let result = true
    if (data.condition !== null) {
      for (const [key, value] of Object.entries(data.condition)) {
        if (formValues[key].value !== String(value)) {
          result = false
        }
      }
    }
    return result
  }

  const handleChange = (t: string) => {
    changeHandler(
      data.key,
      t,
    )
  }

  if (!shouldRender()) {
    return null
  }

  const renderTrail=() => <Text style={styles.unitLabelInput}>{data.unit}</Text>

  return (
    <View style={styles.containerInput}>
      <InputOutline
        style={styles.inputWrapperInput}
        keyboardType={data.keyboard_type}
        placeholder={data.placeholder}
        activeColor={Colors.NEW_PRIMARY}
        inactiveColor={Colors.TEXT_LIGHT}
        placeholderTextColor={Colors.TEXT_LIGHT}
        fontSize={16}
        paddingVertical={18}
        value={formValues[data.key].value}
        onChangeText={handleChange}
        returnKeyType='done'
        fontFamily={Typography.FONT_FAMILY_SEMI_BOLD}
        trailingIcon={renderTrail}
      />
    </View>
  )
}

export default FormTextInputElement

const styles = StyleSheet.create({
  containerInput: {
    width: '100%',
    height: 60,
    alignItems: 'center',
    marginVertical: 20,
    flexDirection: 'row',
  },
  inputWrapperInput: {
    borderRadius: 10,
    width: '90%',
    height: '100%',
    marginHorizontal: '5%',
  },
  unitLabelInput: {
    color: Colors.TEXT_LIGHT,
  },
})
