import React from 'react'
import { FlashList } from '@shopify/flash-list'
import PlantPlotCards from './PlantPlotCards'
import { StyleSheet } from 'react-native'
import { Colors } from 'src/utils/constants'


const PlotPlantList = () => {
    return (
        <FlashList renderItem={({ item }) => (<PlantPlotCards item={item} />)} data={[1, 2, 3, 4, 5]} estimatedItemSize={100} contentContainerStyle={styles.container}/>
    )
}

export default PlotPlantList

const styles=StyleSheet.create({
    container:{
        backgroundColor:Colors.BACKDROP_COLOR,
    }
})

