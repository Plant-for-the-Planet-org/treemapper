import * as React from 'react'
import { useWindowDimensions } from 'react-native'
import { TabView, SceneMap } from 'react-native-tab-view'
import { useState } from 'react'
import AdditionalFormTabBar from './ActivityLogsTabBar'
import AllLogs from './AllLogs'
import ErrorLogs from './ErrorLogs'


const renderScene = SceneMap({
  all: AllLogs,
  errors: ErrorLogs,
})

const AdditionalTabView = () => {
  const layout = useWindowDimensions()

  const [routeIndex, setRouteIndex] = useState(0)
  const [tabRoutes] = useState([
    { key: 'all', title: "All" },
    { key: 'errors', title: "Errors" },
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

export default AdditionalTabView

