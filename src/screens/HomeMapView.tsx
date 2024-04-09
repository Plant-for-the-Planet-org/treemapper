import {StyleSheet, View} from 'react-native'
import React, {useState} from 'react'
import DisplayMap from 'src/components/map/DisplayMap'
import HomeHeader from 'src/components/home/HomeHeader'
import FilterModal from 'src/components/home/FilterModal'
import ProjectModal from 'src/components/home/ProjectModal'
import UserlocationMarker from 'src/components/map/UserlocationMarker'

const HomeMapView = () => {
  const [showFilterModal, setFileterModal] = useState(false)
  const [showProjectModal, setProjectModal] = useState(false)

  const toogleFilterModal = () => {
    setFileterModal(!showFilterModal)
  }

  const toogleProjectModal = () => {
    setProjectModal(!showProjectModal)
  }

  return (
    <View style={styles.contaner}>
      <HomeHeader
        toogleFilterModal={toogleFilterModal}
        toogleProjectModal={toogleProjectModal}
      />
      <DisplayMap />
      <UserlocationMarker />
      <FilterModal
        isVisible={showFilterModal}
        toogleModal={toogleFilterModal}
      />
      <ProjectModal
        isVisible={showProjectModal}
        toogleModal={toogleProjectModal}
      />
    </View>
  )
}

export default HomeMapView

const styles = StyleSheet.create({
  contaner: {
    flex: 1,
  },
})