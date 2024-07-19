import * as React from 'react'
import { useWindowDimensions } from 'react-native'
import { TabView, SceneMap } from 'react-native-tab-view'
import { useState } from 'react'
import AdditionalFormTabBar from '../additionalData/AdditionalFormTabBar'
import Intensity from './IntensityMain'
import Frequency from './FrequencyMain'


const ProjectConfigTabView = () => {
  const layout = useWindowDimensions()
  const renderScene = SceneMap({
    intensity: ()=><Intensity intensity={75}/>,
    frequency: Frequency,
  })
  
  const [routeIndex, setRouteIndex] = useState(0)
  const [tabRoutes] = useState([
    { key: 'intensity', title: "Intensity" },
    { key: 'frequency', title:"Frequency"},
  ]);

  return (
    <TabView
    navigationState={{ index: routeIndex, routes: tabRoutes }}
    renderScene={renderScene}
      onIndexChange={setRouteIndex}
      initialLayout={{ width: layout.width }}
      renderTabBar={props => (
        <AdditionalFormTabBar {...props} tabRoutes={tabRoutes} setRouteIndex={setRouteIndex} />
      )}
    />
  )
}

export default ProjectConfigTabView
