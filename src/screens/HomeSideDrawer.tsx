import { StyleSheet, View } from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import SideBarList from 'src/components/sidebar/SideBarList'
import SidebarHeader from 'src/components/sidebar/SidebarHeader'
import SideBarFooter from 'src/components/sidebar/SideBarFooter'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { Colors } from 'src/utils/constants'
import { SafeAreaView } from 'react-native-safe-area-context'

const HomeSideDrawer = () => {
  const isLoggedIn = useSelector((state: RootState) => state.appState.isLoggedIn)
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header label={''} />
      <SidebarHeader />
      <View style={styles.wrapper}>
        <SideBarList isLoggedIn={isLoggedIn} />
      </View>
      <SideBarFooter isLoggedIn={isLoggedIn} />
    </SafeAreaView>
  )
}

export default HomeSideDrawer

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  wrapper: {
    flex: 1,
    backgroundColor: Colors.BACKDROP_COLOR,
    paddingBottom: 30
  }
})
