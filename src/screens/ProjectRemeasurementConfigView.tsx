import { StyleSheet } from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import ProjectConfigTabView from 'src/components/remeasurement/ProjectConfigTabView'
import { Colors } from 'src/utils/constants'
import { useRoute, RouteProp } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { SafeAreaView } from 'react-native-safe-area-context'

const ProjectRemeasurementConfigView = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'ProjectRemeasurementConfig'>>()
  const pID = route.params?.id;


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header label="Project Config" />
      <ProjectConfigTabView pid={pID} />
    </SafeAreaView>
  )
}

export default ProjectRemeasurementConfigView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    paddingTop: 20
  },
  wrapper: {
    width: 50,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  }
})
