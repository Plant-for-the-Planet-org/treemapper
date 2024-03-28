import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import {scaleFont, scaleSize} from 'src/utils/constants/mixins'
import BackIcon from 'assets/images/svg/BackIcon.svg'
import {Colors} from 'src/utils/constants'
import {useNavigation} from '@react-navigation/native'
import {StackNavigationProp} from '@react-navigation/stack'
import {RootStackParamList} from 'src/types/type/navigation'

interface Props {
  label: string
}

const Header = (props: Props) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const goBack = () => {
    navigation.goBack()
  }
  return (
    <View style={styles.container}>
      <BackIcon style={styles.backIcon} onPress={goBack}/>
      <Text style={styles.title}>{props.label}</Text>
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
    marginLeft: 10,
  },
  title: {
    fontSize: scaleFont(22),
    color: Colors.BLACK,
    fontWeight: '600',
    marginLeft: 15,
    letterSpacing: 0.4,
  },
})
