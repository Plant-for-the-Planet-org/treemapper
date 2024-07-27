import { StyleSheet, View } from 'react-native'
import React, { useState } from 'react'
import DisplayMap from 'src/components/map/DisplayMap'
import HomeHeader from 'src/components/home/HomeHeader'
import FilterModal from 'src/components/home/FilterModal'
import ProjectModal from 'src/components/home/ProjectModal'
import UserlocationMarker from 'src/components/map/UserlocationMarker'
import CarouselModal from 'src/components/carousel/CarouselModal'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import CarouselHeader from 'src/components/carousel/CarouselHeader'

import LocationPermissionModal from 'src/components/map/LocationPermissionModal'
import SatelliteIconWrapper from 'src/components/map/SatelliteIconWrapper'
const HomeMapView = () => {

  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)

  const showCarousel = useSelector(
    (state: RootState) => state.displayMapState.showCarousel,
  )
  const toogleFilterModal = () => {
    setShowFilterModal(!showFilterModal)
  }

  const toogleProjectModal = () => {
    setShowProjectModal(!showProjectModal)
  }


  return (
    <View style={[styles.contaner]}>
      {showCarousel ? (
        <CarouselHeader />
      ) : (
        <HomeHeader
          toogleFilterModal={toogleFilterModal}
          toogleProjectModal={toogleProjectModal}
        />
      )}
      <DisplayMap />
      <SatelliteIconWrapper />
      <UserlocationMarker />
      <FilterModal
        isVisible={showFilterModal}
        toogleModal={toogleFilterModal}
      />
      <ProjectModal
        isVisible={showProjectModal}
        toogleModal={toogleProjectModal}
      />
      {showCarousel && <CarouselModal />}
      <LocationPermissionModal />
    </View>
  )
}

export default HomeMapView

const styles = StyleSheet.create({
  contaner: {
    flex: 1,
  },
})
