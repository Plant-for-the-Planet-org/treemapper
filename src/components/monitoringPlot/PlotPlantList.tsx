import React from 'react'
import { FlashList } from '@shopify/flash-list'
import PlantPlotCards from './PlantPlotCards'
import { StyleSheet } from 'react-native'
import { Colors } from 'src/utils/constants'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'


const PlotPlantList = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const handleSelection=()=>{
        navigation.navigate('AddRemeasurment')
    }
    return (
        <FlashList
        renderItem={({ item }) => (<PlantPlotCards item={item} handleSelection={handleSelection}/>)}
        data={[1, 2, 3, 4, 5]} estimatedItemSize={100}
        contentContainerStyle={styles.container}
        />
    )
}

export default PlotPlantList

const styles=StyleSheet.create({
    container:{
        backgroundColor:Colors.BACKDROP_COLOR,
    }
})

