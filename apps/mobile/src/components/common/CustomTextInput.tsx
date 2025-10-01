import { Pressable, StyleSheet } from 'react-native'
import React from 'react'
import { InputOutline } from 'react-native-input-outline'
import { Colors, Typography } from 'src/utils/constants'

interface Props {
  label: string
  value: string
  onChangeHandler: (t: string) => void
}

const CustomTextInput = (props: Props) => {
  const { label, onChangeHandler, value } = props
  return (
    <Pressable style={styles.container}>
      <InputOutline
        style={styles.inputWrapper}
        placeholder={label}
        fontColor={Colors.DARK_TEXT_COLOR}
        paddingVertical={16}
        activeColor={Colors.NEW_PRIMARY}
        returnKeyType="done"
        value={value}
        placeholderTextColor={Colors.GRAY_BORDER}
        defaultValue={value}
        onChangeText={onChangeHandler}
        fontSize={18}
        fontFamily={Typography.FONT_FAMILY_SEMI_BOLD}
      />
    </Pressable>
  )
}

export default CustomTextInput

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height:59,
    alignItems: 'center',
    marginVertical: 15,
    flexDirection: 'row',
  },
  inputWrapper: {
    borderRadius: 5,
    paddingHorizontal: 0,
    width: '90%',
    height: '100%',
    marginHorizontal: '5%',
    backgroundColor: Colors.BACKDROP_COLOR,
  },
  unitLabel: {
    color: Colors.GRAY_TEXT,
  },
})
