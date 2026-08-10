import * as React from 'react'
import { useWindowDimensions } from 'react-native'
import { TabView, SceneMap } from 'react-native-tab-view'
import { useState } from 'react'
import ActivityLogsTabBar from './ActivityLogsTabBar'
import AllLogs from './AllLogs'
import ErrorLogs from './ErrorLogs'
import i18next from 'i18next'


const renderScene = SceneMap({
  all: AllLogs,
  errors: ErrorLogs,
})

const AdditionalTabView = () => {
  const layoutData = useWindowDimensions()

  const [routeIndex, setRouteIndex] = useState(0)
  const [tabRoutes] = useState([
    { key: 'all', title: i18next.t('label.all') },
    { key: 'errors', title: i18next.t('label.errors') },
  ]);

  return (
    <TabView
      navigationState={{ index: routeIndex, routes: tabRoutes }}
      renderScene={renderScene}
      onIndexChange={setRouteIndex}
      initialLayout={{ width: layoutData.width }}
      renderTabBar={props => (
        <ActivityLogsTabBar {...props} tabRoutes={tabRoutes} setRouteIndex={setRouteIndex} />
      )}
    />
  )
}

export default AdditionalTabView

