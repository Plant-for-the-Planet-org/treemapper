import { StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'

import { SafeAreaView } from 'react-native-safe-area-context'
// import ProjectDropdown from 'src/components/dataExplore/ProjectDropDown'
import ProjectDropdown from 'dashboard/pages/dashboardHeader/DashboardHeaderNative'
import { useSelector } from 'react-redux'
import { RootState } from '../store'

const DataExplorerView = () => {
  const appToken = useSelector((state: RootState) => state.appState.accessToken)
  console.log("SDC",`Bearer ${appToken}`)
  return (
    <SafeAreaView>
      <View style={styles.container}>
        <ProjectDropdown token={`${appToken}`} />

      </View>
    </SafeAreaView>
  )
}

export default DataExplorerView

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10
  }
})