import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import {scaleFont, scaleSize} from 'src/utils/constants/mixins'
import BackIcon from 'assets/images/svg/BackIcon.svg'
import {Colors, Typography} from 'src/utils/constants'
import {useNavigation} from '@react-navigation/native'
import {StackNavigationProp} from '@react-navigation/stack'
import {RootStackParamList} from 'src/types/type/navigation.type'

interface Props {
  label: string
  rightComponet?: React.ReactNode | null
  showBackIcon?: boolean
  note?: string
}

const Header = (props: Props) => {
  const {rightComponet, label, showBackIcon = true, note} = props
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const goBack = () => {
    navigation.goBack()
  }
  return (
    <View style={styles.container}>
      {showBackIcon && <BackIcon style={styles.backIcon} onPress={goBack} />}
      <View style={styles.HeaderWrapper}>
        <Text style={styles.title}>{label}</Text>
        {note && <Text style={styles.note}>{note}</Text>}
      </View>
      <View style={styles.divider} />
      {rightComponet}
    </View>
  )
}

export default Header

const styles = StyleSheet.create({
  container: {
    height: scaleSize(60),
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
  },
  backIcon: {
    width: 20,
    height: 20,
    marginLeft: 20,
  },
  HeaderWrapper: {
    paddingLeft: '8%',
    justifyContent: 'center',
  },
  title: {
    fontSize: scaleFont(22),
    color: Colors.BLACK,
    letterSpacing: 0.4,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
  note: {
    fontSize: scaleFont(12),
    color: Colors.TEXT_LIGHT,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    marginLeft: 2,
    letterSpacing: 0.4,
  },
  divider: {
    flex: 1,
  },
})
