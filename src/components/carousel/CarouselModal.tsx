import { Dimensions, StyleSheet, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import Carousel from 'react-native-reanimated-carousel'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { InterventionData, SampleTree } from 'src/types/interface/slice.interface'
import CarouselItem from './CarouselItem'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { clearCarouselData, updateActiveIndex, updateActiveInterventionIndex, updateShowOverlay } from 'src/store/slice/displayMapSlice'
import CarouselIInterventiontem from './CarouselIInterventiontem'

const { width } = Dimensions.get('window') // Get screen width

const CarouselModal = () => {
  const [carouselData, setCarouselData] = useState<InterventionData>(null)
  const { showCarousel, selectedIntervention, activeIndex, showOverlay, adjacentIntervention, activeInterventionIndex } = useSelector(
    (state: RootState) => state.displayMapState,
  )
  const dispatch = useDispatch()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const carouselRef = useRef(null)
  useEffect(() => {
    if (showCarousel) {
      const interventionData: InterventionData =
        JSON.parse(selectedIntervention)

      setCarouselData(interventionData)
    }
  }, [showCarousel, selectedIntervention])

  const handleNavigation = (id: string) => {
    dispatch(clearCarouselData())
    navigation.navigate('InterventionPreview', { id: 'preview', intervention: id })
  }

  const showInterventionDetails = () => {
    dispatch(updateShowOverlay(false))
  }

  const updateIndex = (i: number) => {
    if (!showOverlay) {
      dispatch(updateActiveIndex(i))
    } else {
      dispatch(updateActiveInterventionIndex(i))
    }
  }


  useEffect(() => {
    if (carouselRef && carouselRef.current !== null) {
      carouselRef.current.scrollTo({ index: activeIndex, animated: true })
    }
  }, [activeIndex])

  
  useEffect(() => {
    if (carouselRef && carouselRef.current !== null) {
      carouselRef.current.scrollTo({ index: activeInterventionIndex, animated: true })
    }
  }, [activeInterventionIndex])


  const renderCaroulselItem = (item: any) => {
    if (showOverlay) {
      return <CarouselIInterventiontem data={item} onPress={showInterventionDetails} />
    } else {
      return <CarouselItem data={item} onPress={handleNavigation} />
    }
  }

  const getData = (): InterventionData[] | SampleTree[] => {
    if (showOverlay) {
      return adjacentIntervention
    }
    if (carouselData && carouselData.sample_trees) {
      return carouselData.sample_trees
    }
    return []
  }

  return (
    <View style={styles.container}>
      <Carousel
        data={getData()}
        width={width}
        height={150}
        ref={carouselRef}
        scrollAnimationDuration={1000}
        snapEnabled={true}
        onScrollEnd={updateIndex}
        loop={false}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.9,
          parallaxScrollingOffset: 60,
        }}
        renderItem={({ item }) => (renderCaroulselItem(item))}
      />
    </View>
  )
}

export default CarouselModal

const styles = StyleSheet.create({
  container: {
    height: 125,
    position: 'absolute',
    bottom: 150,
    zIndex: 9
  },
})
