import {Dimensions, StyleSheet, View} from 'react-native'
import React, {useEffect, useState} from 'react'
import Carousel from 'react-native-reanimated-carousel'
import {useSelector} from 'react-redux'
import {RootState} from 'src/store'
import {InterventionData} from 'src/types/interface/slice.interface'
import CarouselItem from './CarouselItem'

const {width} = Dimensions.get('window') // Get screen width

const CarouselModal = () => {
  const [carouselData, setCarouselData] = useState<InterventionData>(null)
  const {showCarousel, selectedIntervention} = useSelector(
    (state: RootState) => state.displayMapState,
  )

  useEffect(() => {
    if (showCarousel) {
      const interventionData: InterventionData =
        JSON.parse(selectedIntervention)

      setCarouselData(interventionData)
    }
  }, [showCarousel, selectedIntervention])

  return (
    <View style={styles.container}>
      <Carousel
        data={carouselData ? carouselData.sample_trees : []}
        width={width}
        height={150}
        scrollAnimationDuration={1000}
        snapEnabled={true}
        loop={false}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.9,
          parallaxScrollingOffset: 60,
        }}
        renderItem={({item}) => <CarouselItem data={item} />}
      />
    </View>
  )
}

export default CarouselModal

const styles = StyleSheet.create({
  container: {
    height: 150,
    position: 'absolute',
    bottom: 100,
    zIndex:9
  },
})
