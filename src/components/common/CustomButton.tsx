import {
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native'
import React, { ReactNode } from 'react'
import { scaleFont } from 'src/utils/constants/mixins'
import { Colors, Typography } from 'src/utils/constants'
import FadeBackground from './FadeBackground'
import AddIcon from 'assets/images/svg/AddIcon.svg'
import ArrowDownIcon from 'assets/images/svg/ShowDownIcon.svg'

interface Props {
  label: string | ReactNode
  pressHandler: () => void
  containerStyle?: ViewStyle
  labelStyle?: TextStyle
  wrapperStyle?: ViewStyle
  loading?: boolean
  leftIcon?: React.ReactNode
  disable?: boolean
  hideFadeIn?: boolean
  showAdd?: boolean
  showDown?: boolean
  grayOut?: boolean
  rightIcon?: React.ReactNode
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
    showAdd,
    showDown,
    grayOut,
    rightIcon
  } = props

  const handlePress = () => {
    if (disable) {
      return
    }

    if (!loading) {
      pressHandler()
    }
  }

  const returnButtonColor = () => {
    if (grayOut) {
      return Colors.GRAY_BACKDROP
    }
    if (disable) {
      return '#209653'
    }
    return Colors.NEW_PRIMARY
  }

  return (
    <TouchableOpacity
      style={[styles.container, { ...containerStyle }]}
      onPress={handlePress}>
      {!hideFadeIn && <FadeBackground />}
      <View
        style={[
          styles.wrapper,
          { backgroundColor: returnButtonColor() },
          { ...wrapperStyle },
        ]}>
        {loading ? (
          <ActivityIndicator color={Colors.WHITE} size="small" />
        ) : (
          <View style={styles.labelWrapper}>
            {showAdd && <AddIcon width={15} height={15} style={{ marginRight: 10 }} fill={Colors.WHITE} />}
            {showDown && <ArrowDownIcon width={15} height={15} style={{ marginRight: 10 }} fill={Colors.WHITE} />}
            <Text style={[styles.labelStyle, { ...labelStyle }]}>{label}</Text>
          </View>
        )}
        {leftIcon && <View style={styles.leftIconWrapper}>{leftIcon}</View>}
        {rightIcon && <View style={styles.rightIconWrapper}>{rightIcon}</View>}

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
  rightIconWrapper: {
    position: 'absolute',
    right: '5%',
  },
  labelWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row'
  },
})
