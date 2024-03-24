import {StyleSheet, View} from 'react-native'
import React from 'react'
import HamburgerIcon from 'assets/images/svg/HamburgerIcon.svg'
import FilterMapIcon from 'assets/images/svg/FilterMapIcon.svg'
import HomeMapIcon from 'assets/images/svg/HomeMapIcon.svg'

interface Props {
  toogleFilterModal: () => void
}

const HomeHeader = (props: Props) => {
  const {toogleFilterModal} = props
  return (
    <View style={styles.container}>
      <HamburgerIcon onPress={toogleFilterModal} style={styles.iconWrapper} />
      <View style={styles.sectionWrapper} />
      <HomeMapIcon onPress={toogleFilterModal} style={styles.iconWrapper} />
      <FilterMapIcon onPress={toogleFilterModal} style={styles.iconWrapper} />
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
    top:10
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
