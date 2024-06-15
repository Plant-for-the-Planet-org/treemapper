import React from 'react'
import { FlashList } from '@shopify/flash-list'
import PlantPlotCards from './PlantPlotCards'
import { StyleSheet, View } from 'react-native'
import { Colors } from 'src/utils/constants'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { PlantedPlotSpecies } from 'src/types/interface/slice.interface'
import CustomButton from '../common/CustomButton'

interface Props {
    plants: PlantedPlotSpecies[]
    plotID: string
}

const PlotPlantList = (props: Props) => {
    const { plants, plotID } = props;
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const handleSelection = (plantID: string) => {
        navigation.navigate('AddRemeasurment', { id: plotID, plantID: plantID })
    }
    const addMorePlants = () => {
        navigation.navigate('AddPlantDetailsPlot', { id: plotID, })
    }
    return (
        <View style={styles.container}>
            <FlashList
                renderItem={({ item, index }) => (<PlantPlotCards item={item} handleSelection={handleSelection} index={index} />)}
                data={plants} estimatedItemSize={100}
            />
            <CustomButton
                label="Add Plants"
                containerStyle={styles.btnContainer}
                pressHandler={addMorePlants}
            />
        </View>
    )
}

export default PlotPlantList

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKDROP_COLOR,
    },
    btnContainer: {
        width: '100%',
        height: 70,
        position: 'absolute',
        bottom: 0,
    },
})

