import {StyleSheet, Text, TouchableOpacity} from 'react-native'
import React from 'react'
import { useDispatch } from 'react-redux'
import { clearCarouselData } from 'src/store/slice/displayMapSlice';

const CarouselHeader = () => {
  const dispatch =  useDispatch();
  const onPress=()=>{
    dispatch(clearCarouselData())
  }
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text>sd</Text>
    </TouchableOpacity>
  )
}

export default CarouselHeader

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 100,
    position:'absolute',
    top:0,
    zIndex:10,
    backgroundColor: 'blue',
  },
})
