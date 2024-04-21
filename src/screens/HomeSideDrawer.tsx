import {StyleSheet} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import SideBarList from 'src/components/sidebar/SideBarList'
import SidebarHeader from 'src/components/sidebar/SidebarHeader'
import SideBarFooter from 'src/components/sidebar/SideBarFooter'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { SafeAreaView } from 'react-native-safe-area-context'

const HomeSideDrawer = () => {
  const isLogedIn = useSelector((state: RootState) => state.appState.isLogedIn)

  return (
    <SafeAreaView style={styles.container}>
      <Header label={''} />
      <SidebarHeader />
      <SideBarList isLogedIn={isLogedIn}/>
      <SideBarFooter isLogedIn={isLogedIn}/>
    </SafeAreaView>
  )
}

export default HomeSideDrawer

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
