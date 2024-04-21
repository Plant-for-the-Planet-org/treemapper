import { StyleSheet } from 'react-native'
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
import {
  SafeAreaView,
} from 'react-native-safe-area-context';
const HomeMapView = () => {

  const [showFilterModal, setFileterModal] = useState(false)
  const [showProjectModal, setProjectModal] = useState(false)
  const showCarousel = useSelector(
    (state: RootState) => state.displayMapState.showCarousel,
  )
  const toogleFilterModal = () => {
    setFileterModal(!showFilterModal)
  }

  const toogleProjectModal = () => {
    setProjectModal(!showProjectModal)
  }


  return (
    <SafeAreaView style={[styles.contaner]}>
      {showCarousel ? (
        <CarouselHeader />
      ) : (
        <HomeHeader
          toogleFilterModal={toogleFilterModal}
          toogleProjectModal={toogleProjectModal}
        />
      )}
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
      {showCarousel && <CarouselModal />}
    </SafeAreaView>
  )
}

export default HomeMapView

const styles = StyleSheet.create({
  contaner: {
    flex: 1,
  },
})
