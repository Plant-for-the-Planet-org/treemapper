import { KeyboardTypeOptions, StyleSheet, View } from 'react-native'
import React from 'react'
import { InputOutline } from 'react-native-input-outline'
import { Text } from 'react-native'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'

interface Props {
  placeholder: string
  changeHandler: (h: string) => void
  keyboardType: KeyboardTypeOptions
  trailingtext: string
  errMsg: string
  autoFocus?: boolean
  defaultValue?: string
}

const OutlinedTextInput = (props: Props) => {
  const { placeholder, changeHandler, keyboardType, trailingtext, errMsg, autoFocus, defaultValue } = props
  return (
    <View style={styles.container}>
      <InputOutline
        style={styles.inputWrapper}
        keyboardType={keyboardType}
        placeholder={placeholder}
        fontColor={Colors.DARK_TEXT_COLOR}
        paddingVertical={15}
        activeColor={Colors.PRIMARY}
        returnKeyType="done"
        inactiveColor={Colors.GRAY_BORDER}
        placeholderTextColor={Colors.GRAY_BORDER}
        onChangeText={changeHandler}
        fontSize={scaleFont(18)}
        fontFamily={Typography.FONT_FAMILY_SEMI_BOLD}
        error={errMsg.length ? errMsg : undefined}
        autoFocus={autoFocus || false}
        value={defaultValue ? defaultValue : ""}
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
    marginBottom: 15,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  inputWrapper: {
    borderRadius: 8,
    width: '95%',
    height: '100%',
  },
  unitLabel: {
    color: Colors.TEXT_LIGHT,
    fontSize: scaleFont(16),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD
  },
})
