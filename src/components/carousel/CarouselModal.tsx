import {Dimensions, Image, StyleSheet, Text, View} from 'react-native'
import React, { useEffect, useState } from 'react'
import Carousel from 'react-native-reanimated-carousel'
import { CarouselInterventionData } from 'src/types/interface/app.interface'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { InterventionData } from 'src/types/interface/slice.interface'


  
const {width} = Dimensions.get('window') // Get screen width

const CarouselModal = () => {
  const [carouselData, setCarouselData] = useState<CarouselInterventionData[]>([])
  const {showCarousel,selectedIntervention} = useSelector(
    (state: RootState) => state.displayMapState,
  )

  useEffect(() => {
    if(showCarousel){
      const interventionData: InterventionData = JSON.parse(selectedIntervention)
      const mapData = interventionData.sample_trees.map((el)=>({
        id: el.tree_id,
        image: el.image_url
      }))
      setCarouselData(mapData)
    }
  }, [showCarousel, selectedIntervention])
  

  return (
    <View style={styles.container}>
      <Carousel
        data={carouselData}
        width={width}
        height={width / 2} // Adjust height as needed
        loop
        autoPlay
        scrollAnimationDuration={1000} // Customize animation duration
        renderItem={({item}) => (
          <View
            style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            {item.image ? (
              <Image
                source={{uri: item.image}}
                style={{width: '100%', height: '100%'}}
              />
            ) : (
              <Text>{item.id}</Text>
            )}
          </View>
        )}
      />
    </View>
  )
}

export default CarouselModal

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '40%',
    backgroundColor: 'red',
    position: 'absolute',
    bottom: 0,
  },
})
