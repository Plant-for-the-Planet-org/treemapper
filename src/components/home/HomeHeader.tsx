import {StyleSheet, View} from 'react-native'
import React from 'react'
import HamburgerIcon from 'assets/images/svg/HamburgerIcon.svg'
import FilterMapIcon from 'assets/images/svg/FilterMapIcon.svg'
import HomeMapIcon from 'assets/images/svg/HomeMapIcon.svg'
import {useNavigation} from '@react-navigation/native'
import {StackNavigationProp} from '@react-navigation/stack'
import {RootStackParamList} from 'src/types/type/navigation.type'
import {useSelector} from 'react-redux'
import {RootState} from 'src/store'

interface Props {
  toogleFilterModal: () => void
  toogleProjectModal: () => void
}

const HomeHeader = (props: Props) => {
  const {toogleFilterModal, toogleProjectModal} = props
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const userType = useSelector((state: RootState) => state.userState.type)
  const openHomeDrawer = () => {
    navigation.navigate('HomeSideDrawer')
  }
  return (
    <View style={styles.container}>
      <HamburgerIcon onPress={openHomeDrawer} style={styles.iconWrapper} />
      <View style={styles.sectionWrapper} />
      {userType && userType === 'tpo'? (
        <>
          <HomeMapIcon
            onPress={toogleProjectModal}
            style={styles.iconWrapper}
          />
          <FilterMapIcon
            onPress={toogleFilterModal}
            style={styles.iconWrapper}
          />
        </>
      ) : null}
    </View>
  )
}

export default HomeHeader

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    height: 60,
    width: '100%',
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    top: 10,
  },
  iconWrapper: {
    width: 40,
    height: 40,
  },
  sectionWrapper: {
    flex: 1,
  },
  endWrapper: {},
})
