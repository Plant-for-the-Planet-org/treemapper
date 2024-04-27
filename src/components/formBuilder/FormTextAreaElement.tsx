import {StyleSheet, View} from 'react-native'
import React from 'react'
import {FormElement} from 'src/types/interface/form.interface'
import {InputOutline} from 'react-native-input-outline'
import {Text} from 'react-native'
import {Colors, Typography} from 'src/utils/constants'

interface Props {
  data: FormElement
  formValues: {[key: string]: any}
  changeHandler: (key: string, value: string) => void
}

const FormTextAreaElement = (props: Props) => {
  const {data, formValues, changeHandler} = props
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

  const handleChange=(t:string)=>{
    changeHandler(
      data.key,
      t,
    )
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
        activeColor={Colors.NEW_PRIMARY}
        inactiveColor={Colors.TEXT_LIGHT}
        placeholderTextColor={Colors.TEXT_LIGHT}
        fontSize={18}
        value={formValues[data.key].value}
        onChangeText={handleChange}
        returnKeyType='done'
        multiline
        fontFamily={Typography.FONT_FAMILY_SEMI_BOLD}
        trailingIcon={() => <Text style={styles.unitLabel}>{data.unit}</Text>}
      />
    </View>
  )
}

export default FormTextAreaElement

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight:130,
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
    color: Colors.TEXT_LIGHT,
  },
})