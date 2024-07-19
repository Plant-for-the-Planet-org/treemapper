import {StyleSheet} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import ProjectList from 'src/components/manageProject/ProjectList'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'

const ManageProjectsView = () => {

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const handleProjects=(id:string)=>{
    navigation.navigate('ProjectRemeasurementConfig',{id})
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header label="Manage Projects" />
      <ProjectList onProjectPress={handleProjects} isSelectable={true}/>
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
