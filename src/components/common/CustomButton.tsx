import {
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native'
import React from 'react'
import { scaleFont } from 'src/utils/constants/mixins'
import { Colors, Typography } from 'src/utils/constants'
import FadeBackground from './FadeBackground'
import AddIcon from 'assets/images/svg/AddIcon.svg'

interface Props {
  label: string
  pressHandler: () => void
  containerStyle?: ViewStyle
  labelStyle?: TextStyle
  wrapperStyle?: ViewStyle
  loading?: boolean
  leftIcon?: React.ReactNode
  disable?: boolean
  hideFadeIn?: boolean
  showAdd?: boolean
}

const CustomButton = (props: Props) => {
  const {
    label,
    containerStyle = {},
    labelStyle = {},
    wrapperStyle = {},
    pressHandler,
    loading,
    leftIcon,
    disable,
    hideFadeIn,
    showAdd
  } = props

  const handlePress = () => {
    if (disable) {
      return
    }

    if (!loading) {
      pressHandler()
    }
  }

  return (
    <TouchableOpacity
      style={[styles.container, { ...containerStyle }]}
      onPress={handlePress}>
      {!hideFadeIn && <FadeBackground />}
      <View
        style={[
          styles.wrapper,
          { backgroundColor: disable ? Colors.GRAY_LIGHT : Colors.NEW_PRIMARY },
          { ...wrapperStyle },
        ]}>
        {loading ? (
          <ActivityIndicator color={Colors.WHITE} size="small" />
        ) : (
          <View style={styles.labelWrapper}>
            {showAdd && <AddIcon width={15} height={15} style={{ marginRight: 10 }} fill={Colors.WHITE}/>}
            <Text style={[styles.labelStyle, { ...labelStyle }]}>{label}</Text>
          </View>
        )}
        {leftIcon && <View style={styles.leftIconWrapper}>{leftIcon}</View>}
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
  labelStyle: {
    fontSize: scaleFont(16),
    color: Colors.WHITE,
    letterSpacing: 0.2,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
  leftIconWrapper: {
    position: 'absolute',
    left: 20,
  },
  labelWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row'
  },
})
