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
import SatelliteIconWrapper from 'src/components/map/SatelliteIconWrapper'
import { StatusBar } from 'expo-status-bar'
import MapAttribution from 'src/components/common/MapAttribution'
const HomeMapView = () => {

  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const { showCarousel, mainMapView } = useSelector(
    (state: RootState) => state.displayMapState,
  )
  const userType = useSelector(
    (state: RootState) => state.userState.type,
  )



  const toggleFilterModal = () => {
    setShowFilterModal(!showFilterModal)
  }

  const toggleProjectModal = () => {
    setShowProjectModal(!showProjectModal)
  }


  return (
    <View style={[styles.container]}>
      <StatusBar style={mainMapView === 'SATELLITE' ? 'light' : 'dark'} />
      {showCarousel ? (
        <CarouselHeader />
      ) : (
        <HomeHeader
          toggleFilterModal={toggleFilterModal}
          toggleProjectModal={toggleProjectModal}
        />
      )}
      <DisplayMap />
      <SatelliteIconWrapper />
      <UserlocationMarker low stopAutoFocus={userType === 'tpo'}/>
      <FilterModal
        isVisible={showFilterModal}
        toggleModal={toggleFilterModal}
      />
      <ProjectModal
        isVisible={showProjectModal}
        toggleModal={toggleProjectModal}
      />
      {showCarousel && <CarouselModal />}
      <MapAttribution/>
    </View>
  )
}

export default HomeMapView

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
