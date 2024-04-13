import {
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
  TouchableOpacity,
  View,
} from 'react-native'
import React from 'react'
import {scaleFont} from 'src/utils/constants/mixins'
import {Colors, Typography} from 'src/utils/constants'
import FadeBackground from './FadeBackground'

interface Props {
  label: string
  pressHandler: () => void
  containerStyle?: ViewStyle
  labelStyle?: TextStyle
  wrapperStyle?: ViewStyle
}

const CustomButton = (props: Props) => {
  const {
    label,
    containerStyle = {},
    labelStyle = {},
    wrapperStyle = {},
    pressHandler,
  } = props
  return (
    <TouchableOpacity
      style={[styles.container, {...containerStyle}]}
      onPress={pressHandler}>
      <FadeBackground />
      <View style={[styles.wrapper, {...wrapperStyle}]}>
        <Text style={[styles.lableStyle, {...labelStyle}]}>{label}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default CustomButton

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '85%',
    height: '80%',
    backgroundColor: Colors.PRIMARY_DARK,
    borderRadius: 12,
  },
  lableStyle: {
    fontSize: scaleFont(15),
    color: Colors.WHITE,
    letterSpacing: 0.2,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
})
