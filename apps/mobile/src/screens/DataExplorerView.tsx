import { StyleSheet, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
// import ProjectDropdown from 'src/components/dataExplore/ProjectDropDown'

const DataExplorerView = () => {
  return (
    <SafeAreaView>
      <View style={styles.container}>
        {/* <ProjectDropdown /> */}
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