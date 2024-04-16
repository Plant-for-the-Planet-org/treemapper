import {StyleSheet, View} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import ProjectList from 'src/components/manageProject/ProjectList'

const ManageProjectsView = () => {
  return (
    <View style={styles.container}>
      <Header label="Manage Projects" />
      <ProjectList />
    </View>
  )
}

export default ManageProjectsView

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
