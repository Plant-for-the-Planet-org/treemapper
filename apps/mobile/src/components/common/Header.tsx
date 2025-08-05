import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import BackIcon from 'assets/images/svg/BackIcon.svg'
import { Colors, Typography } from 'src/utils/constants'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'

interface Props {
  label: string
  rightComponent?: React.ReactNode | null
  showBackIcon?: boolean
  note?: string
  backFunc?: () => void
}

const Header = (props: Props) => {
  const { rightComponent, label, showBackIcon = true, note, backFunc } = props
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const goBack = () => {
    if (backFunc) {
      backFunc()
    } else {
      navigation.goBack()
    }
  }
  return (
    <View style={styles.container}>
      {showBackIcon && <TouchableOpacity style={styles.backIcon} onPress={goBack}><BackIcon onPress={goBack} /></TouchableOpacity>}
      <View style={styles.HeaderWrapper}>
        <Text style={styles.title}>{label}</Text>
        {!!note && <Text style={styles.note}>{note}</Text>}</View>
      <View style={styles.divider} />
      {rightComponent}
    </View>
  )
}

export default Header

const styles = StyleSheet.create({
  container: {
    height: 80,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    zIndex: 1,
  },
  backIcon: {
    width: 20,
    height: 20,
    marginLeft: 20,
  },
  HeaderWrapper: {
    paddingLeft: '4%',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    color: Colors.BLACK,
    letterSpacing: 0.4,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
  note: {
    fontSize: 12,
    color: Colors.TEXT_LIGHT,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    marginLeft: 2,
    letterSpacing: 0.4,
  },
  divider: {
    flex: 1,
  },
})
