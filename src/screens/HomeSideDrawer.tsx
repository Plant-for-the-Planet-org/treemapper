import {StyleSheet, View} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import SideBarList from 'src/components/sidebar/SideBarList'
import SidebarHeader from 'src/components/sidebar/SidebarHeader'

const HomeSideDrawer = () => {
  return (
    <View style={styles.container}>
      <Header label={''} />
      <SidebarHeader />
      <SideBarList />
    </View>
  )
}

export default HomeSideDrawer

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
