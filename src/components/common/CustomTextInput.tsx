import {Pressable, StyleSheet} from 'react-native'
import React from 'react'
import {InputOutline} from 'react-native-input-outline'
import {Colors, Typography} from 'src/utils/constants'
import {scaleFont, scaleSize} from 'src/utils/constants/mixins'

interface Props {
  label: string
  value: string
  onChangeHandler: (t: string) => void
}

const CustomTextInput = (props: Props) => {
  const {label, onChangeHandler,value} = props
  return (
    <Pressable style={styles.container}>
      <InputOutline
        style={styles.inputWrapper}
        value={value}
        placeholder={label}
        activeColor={Colors.NEW_PRIMARY}
        inactiveColor={Colors.TEXT_COLOR}
        placeholderTextColor={Colors.TEXT_COLOR}
        fontSize={scaleFont(16)}
        onChangeText={onChangeHandler}
        fontColor={Colors.DARK_TEXT_COLOR}
        backgroundColor={Colors.WHITE}
        fontFamily={Typography.FONT_FAMILY_SEMI_BOLD}
        paddingVertical={15}
      />
    </Pressable>
  )
}

export default CustomTextInput

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: scaleSize(55),
    alignItems: 'center',
    marginVertical: 10,
    flexDirection: 'row',
  },
  inputWrapper: {
    borderRadius: 5,
    paddingHorizontal: 10,
    width: '90%',
    height: '100%',
    marginHorizontal: '5%',
    backgroundColor: Colors.BACKDROP_COLOR,
    paddingVertical:20
  },
  unitLabel: {
    color: Colors.GRAY_TEXT,
  },
})
