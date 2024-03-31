import React from 'react'
import {Text, StyleSheet, TextStyle} from 'react-native'
import {Colors, Typography} from 'src/utils/constants'

interface Props {
  text: string
  style: TextStyle
  primary?: boolean
  onPress: () => void
}

const FlatButton = (props: Props) => {
  const {text, style, primary, onPress} = props
  return (
    <Text
      onPress={onPress}
      style={[styles.flatBtn, primary && styles.primaryColor, style]}>
      {text}
    </Text>
  )
}

const styles = StyleSheet.create({
  flatBtn: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    lineHeight: Typography.LINE_HEIGHT_24,
    color: Colors.TEXT_COLOR,
  },
  primaryColor: {color: Colors.PRIMARY},
})

export default FlatButton
