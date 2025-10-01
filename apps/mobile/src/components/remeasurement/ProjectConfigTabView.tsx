import * as React from 'react'
import { useWindowDimensions } from 'react-native'
import { TabView, SceneMap } from 'react-native-tab-view'
import { useEffect, useState } from 'react'
import AdditionalFormTabBar from '../additionalData/AdditionalFormTabBar'
import Intensity from './IntensityMain'
import Frequency from './FrequencyMain'
import { updateProjectDetails } from 'src/api/api.fetch'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { useToast } from 'react-native-toast-notifications'
import useProjectManagement from 'src/hooks/realm/useProjectManagement'


interface Props {
  pid: string
}



const renderScene = (
  intensityProject,
  setIntensityProject,
  syncAndUpdate,
  loading,
  frequencyProject,
  setFrequencyProject
) => (SceneMap({
  intensity: () => (<Intensity intensity={intensityProject} setSelectedIntensity={setIntensityProject} save={syncAndUpdate} loading={loading} />),
  frequency: () => (<Frequency frequency={frequencyProject} setSelectedFrequency={setFrequencyProject} save={syncAndUpdate} loading={loading} />),
}))



const ProjectConfigTabView = (props: Props) => {
  const { pid } = props
  const [intensityProject, setIntensityProject] = useState(0)
  const [frequencyProject, setFrequencyProject] = useState('')
  const [loading, setLoading] = useState(false)
  const realm = useRealm()
  useEffect(() => {
    setProjectData()
  }, [pid])

  const toast = useToast()
  const { updateProjectInF } = useProjectManagement()
  const setProjectData = () => {
    const projectDetails = realm.objectForPrimaryKey<any>(RealmSchema.Projects, pid)
    if (projectDetails) {
      setIntensityProject(projectDetails.intensity || 0)
      setFrequencyProject(projectDetails.frequency || '')
    }
  }

  const layout = useWindowDimensions()




  const syncAndUpdate = async () => {
    setLoading(true)
    const { success } = await updateProjectDetails({
      i: intensityProject,
      f: frequencyProject,
      id: pid
    })
    if (success) {
      toast.show("Updated successfully")
      await updateProjectInF(pid, frequencyProject, intensityProject)
      setLoading(false)
    } else {
      toast.show("Error ocurred while submitting")
      setLoading(false)
    }
  }




  const [routeIndex, setRouteIndex] = useState(0)
  const [tabRoutes] = useState([
    { key: 'intensity', title: "Intensity" },
    { key: 'frequency', title: "Frequency" },
  ]);

  return (
    <TabView
      navigationState={{ index: routeIndex, routes: tabRoutes }}
      renderScene={renderScene(intensityProject,
        setIntensityProject,
        syncAndUpdate,
        loading,
        frequencyProject,
        setFrequencyProject)}
      onIndexChange={setRouteIndex}
      initialLayout={{ width: layout.width }}
      renderTabBar={props => (
        <AdditionalFormTabBar {...props} tabRoutes={tabRoutes} setRouteIndex={setRouteIndex} />
      )}
    />
  )
}

export default ProjectConfigTabView
