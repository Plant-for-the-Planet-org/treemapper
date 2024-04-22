import {StyleSheet} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import ProjectList from 'src/components/manageProject/ProjectList'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'

const ManageProjectsView = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header label="Manage Projects" />
      <ProjectList />
    </SafeAreaView>
  )
}

export default ManageProjectsView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:Colors.WHITE
  },
})
