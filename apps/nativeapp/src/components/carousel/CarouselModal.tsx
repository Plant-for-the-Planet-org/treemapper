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
import CarouselInterventionItem from './CarouselInterventionItem'

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

  const handleNavigation = (id: string, tree_id?: string) => {
    dispatch(clearCarouselData())
    if (tree_id) {
      navigation.navigate('InterventionPreview', { id: 'preview', intervention: id, sampleTree: tree_id, interventionId:id })
    } else {
      navigation.navigate('InterventionPreview', { id: 'preview', intervention: id ,  interventionId:id })
    }
  }

  const remeasure = (id: string, tree_id?: string) => {
    dispatch(clearCarouselData())
    navigation.navigate('TreeRemeasurement', { interventionId: id, treeId: tree_id })
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


  const renderCarouselItem = (item: any) => {
    if (showOverlay) {
      return <CarouselInterventionItem data={item} onPress={showInterventionDetails} />
    } else {
      return <CarouselItem data={item} onPress={handleNavigation} remeasure={remeasure}/>
    }
  }

  const getData = (): InterventionData[] | SampleTree[] => {
    if (showOverlay) {
      return adjacentIntervention
    }
    if (carouselData && carouselData.sample_trees.length > 0) {
      return carouselData.sample_trees
    }

    if (carouselData && carouselData.sample_trees.length === 0) {
      return [carouselData]
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
        renderItem={({ item }) => (renderCarouselItem(item))}
      />
    </View>
  )
}

export default CarouselModal

const styles = StyleSheet.create({
  container: {
    height: 150,
    position: 'absolute',
    bottom: 150,
    zIndex: 9
  },
})
