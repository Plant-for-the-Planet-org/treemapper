import {Dimensions, StyleSheet, View} from 'react-native'
import React, {useEffect, useState} from 'react'
import Carousel from 'react-native-reanimated-carousel'
import {useDispatch, useSelector} from 'react-redux'
import {RootState} from 'src/store'
import {InterventionData} from 'src/types/interface/slice.interface'
import CarouselItem from './CarouselItem'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { clearCarouselData } from 'src/store/slice/displayMapSlice'

const {width} = Dimensions.get('window') // Get screen width

const CarouselModal = () => {
  const [carouselData, setCarouselData] = useState<InterventionData>(null)
  const {showCarousel, selectedIntervention} = useSelector(
    (state: RootState) => state.displayMapState,
  )
  const dispatch = useDispatch()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()


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
        renderItem={({item}) => <CarouselItem data={item} onPress={handleNavigation} />}
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
    zIndex:9
  },
})
