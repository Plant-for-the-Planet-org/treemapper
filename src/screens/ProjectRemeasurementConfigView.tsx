import { SafeAreaView, StyleSheet } from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import { Colors } from 'react-native/Libraries/NewAppScreen'
import ProjectConfigTabView from 'src/components/remeasurement/ProjectConfigTabView'

const ProjectRemeasurementConfigView = () => {


  return (
    <SafeAreaView style={styles.container}>
      <Header label="Project Config"/>
      <ProjectConfigTabView />
    </SafeAreaView>
  )
}

export default ProjectRemeasurementConfigView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:Colors.WHITE,
    paddingTop:20
  },
  wrapper:{
    width:50,
    height:'100%',
    justifyContent:'center',
    alignItems:'center',
    marginRight:10
  }
})
