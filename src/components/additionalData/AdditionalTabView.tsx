import * as React from 'react'
import {View, useWindowDimensions} from 'react-native'
import {TabView, SceneMap} from 'react-native-tab-view'

const FirstRoute = () => <View style={{flex: 1}} />

const SecondRoute = () => <View style={{flex: 1}} />

const renderScene = SceneMap({
  addtional: FirstRoute,
  meta: SecondRoute,
})

const AdditionalTabView = () => {
  const layout = useWindowDimensions()

  const [index, setIndex] = React.useState(0)
  const [routes] = React.useState([
    {key: 'addtional', title: 'Additional Data'},
    {key: 'meta', title: 'Meta Data'},
  ])

  return (
    <TabView
      navigationState={{index, routes}}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{width: layout.width}}
    />
  )
}

export default AdditionalTabView
