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

interface Props {
  label: string
  pressHandler:()=>void
  containerStyle?: ViewStyle
  labelStyle?: TextStyle
  wrapperStyle?: ViewStyle,
}

const CustomButton = (props: Props) => {
  const {label, containerStyle = {}, labelStyle = {}, wrapperStyle = {},pressHandler} = props
  return (
    <TouchableOpacity style={[styles.container, {...containerStyle}]} onPress={pressHandler}>
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
    marginBottom:10
  },
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 5,
    width:'90%',
    height:'70%',
    backgroundColor: Colors.PRIMARY_DARK,
    borderRadius: 10,
  },
  lableStyle: {
    fontSize: scaleFont(16),
    color: Colors.WHITE,
    fontFamily:Typography.FONT_FAMILY_BOLD
  },
})
