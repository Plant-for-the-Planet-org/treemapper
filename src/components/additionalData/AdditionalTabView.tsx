import * as React from 'react'
import { useWindowDimensions } from 'react-native'
import { TabView, SceneMap } from 'react-native-tab-view'
import { useState } from 'react'
import AdditionalFormTabBar from './AdditionalFormTabBar'
import i18next from 'src/locales/index'
import AdditionalDataForm from './AdditionalDataForm'
import MetaDataForm from './MetaDataForm'


const renderScene = SceneMap({
  form: AdditionalDataForm,
  metadata: MetaDataForm,
})

const AdditionalTabView = () => {
  const layout = useWindowDimensions()

  const [routeIndex, setRouteIndex] = useState(0)
  const [tabRoutes] = useState([
    { key: 'form', title: i18next.t('label.additional_data_form') },
    { key: 'metadata', title: i18next.t('label.additional_data_metadata') },
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
