import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import CtaArrow from 'assets/images/svg/CtaArrow.svg'
import { SideDrawerItem } from 'src/types/interface/app.interface'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useDispatch } from 'react-redux'
import { logoutAppUser, updateUserLogin } from 'src/store/slice/appStateSlice'
import { resetUserDetails } from 'src/store/slice/userStateSlice'
import useAuthentication from 'src/hooks/useAuthentication'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import { Colors, Typography } from 'src/utils/constants'
import { resetProjectState } from 'src/store/slice/projectStateSlice'

interface Props {
  item: SideDrawerItem
}

const SideBarCard = (props: Props) => {
  const { logoutUser } = useAuthentication()
  const { label, screen, icon, visible, key, disable } = props.item
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const dispatch = useDispatch()

  const handleNavigaiton = () => {
    if(disable){
      return
    }
    let params = {}
    if (key === 'logout') {
      handleLogout()
      return
    }
    if (key === 'manage_species') {
      params = { manageSpecies: true }
    }
    navigation.navigate(screen, params)
  }

  const handleLogout = async () => {
    await logoutUser()
    dispatch(updateUserLogin(false))
    dispatch(resetUserDetails())
    dispatch(logoutAppUser())
    dispatch(resetProjectState())
  }

  if (!visible) {
    return null
  }

  return (
    <Pressable style={styles.container} onPress={handleNavigaiton}>
      <View style={[styles.wrapper,{ opacity: disable ? 0.5 : 1, backgroundColor:disable?Colors.BACKDROP_COLOR:'white' }]}>
        <View style={styles.iconWrapper}>{icon}</View>
        <View style={styles.labelWrapper}>
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.arrowWrapper}>
          <CtaArrow />
        </View>
      </View>
    </Pressable>
  )
}

export default SideBarCard

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: scaleSize(60),
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    width: '90%',
    height: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  iconWrapper: {
    height: 25,
    width: 25,
    marginLeft: 10,
    borderRadius: 5,
  },
  labelWrapper: {
    flex: 1,
    marginHorizontal: 10,
  },
  arrowWrapper: {
    marginRight: 10,
    height: 25,
    width: 25,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: scaleFont(16),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginLeft: 10
  },
})
