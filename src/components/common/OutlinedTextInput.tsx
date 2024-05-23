import { KeyboardTypeOptions, StyleSheet, View } from 'react-native'
import React from 'react'
import { InputOutline } from 'react-native-input-outline'
import { Text } from 'react-native'
import { Colors } from 'src/utils/constants'

interface Props {
  placeholder: string
  changeHandler: (h: string) => void
  keyboardType: KeyboardTypeOptions
  trailingtext: string
  errMsg: string
}

const OutlinedTextInput = (props: Props) => {
  const { placeholder, changeHandler, keyboardType, trailingtext, errMsg } = props

  return (
    <View style={styles.container}>
      <InputOutline
        style={styles.inputWrapper}
        keyboardType={keyboardType}
        placeholder={placeholder}
        paddingVertical={18}
        activeColor={Colors.PRIMARY}
        returnKeyType="done"
        inactiveColor={Colors.GRAY_BORDER}
        placeholderTextColor={Colors.GRAY_BORDER}
        onChangeText={changeHandler}
        fontSize={18}
        error={errMsg.length ? errMsg : undefined}
        trailingIcon={() => (
          <Text style={styles.unitLabel}>{trailingtext}</Text>
        )}
      />
    </View>
  )
}

export default OutlinedTextInput

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 60,
    alignItems: 'center',
    marginVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  inputWrapper: {
    borderRadius: 10,
    width: '95%',
    height: '100%',
  },
  unitLabel: {
    color: Colors.GRAY_TEXT,
  },
})
