import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import {Colors, Typography} from 'src/utils/constants'
import Switch from '../common/Switch'
import {FormElement} from 'src/types/interface/form.interface'
import {scaleFont} from 'src/utils/constants/mixins'

interface Props {
  data: FormElement
  formValues: {[key: string]: any}
  changeHandler: (key: string, value: string) => void
}

const FormSwitchElement = (props: Props) => {
  const {data, formValues, changeHandler} = props
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: formValues[data.key].value
              ? Colors.NEW_PRIMARY + '1A'
              : Colors.GRAY_LIGHT,
          },
        ]}>
        <Text style={styles.inputLabel}>{data.label}</Text>
        <View style={styles.divider} />
        <Switch
          value={formValues[data.key].value === 'true'}
          onValueChange={() => {
            changeHandler(
              data.key,
              String(`${formValues[data.key].value === 'false' ? 'true' : 'false'}`),
            )
          }}
          disabled={false}
        />
      </View>
    </View>
  )
}

export default FormSwitchElement

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  inputWrapper: {
    borderRadius: 10,
    width: '90%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 7,
  },
  inputLabel: {
    color: Colors.TEXT_LIGHT,
    fontSize: scaleFont(15),
    letterSpacing: 0.5,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  divider: {
    flex: 1,
  },
})
