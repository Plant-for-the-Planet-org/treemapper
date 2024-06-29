import React, { useEffect, useState } from 'react'
import PlantPlotCards from './PlantPlotCards'
import { StyleSheet, View, FlatList } from 'react-native'
import { Colors, Typography } from 'src/utils/constants'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { PlantedPlotSpecies } from 'src/types/interface/slice.interface'
import CustomButton from '../common/CustomButton'
import EmptyStaticScreen from '../common/EmptyStaticScreen'
import EmptyIcom from 'assets/images/svg/EmptyGroupIcon.svg'
import PlotPlantSearch from './PlotPlantSearch'

interface Props {
    plants: PlantedPlotSpecies[]
    plotID: string
}

const PlotPlantList = (props: Props) => {
    const { plants, plotID } = props;
    const [plantData, setPlandData] = useState<PlantedPlotSpecies[]>([])
    const [noResult, setResult] = useState(false)
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const handleSelection = (plantID: string) => {
        navigation.navigate('AddRemeasurment', { id: plotID, plantID: plantID })
    }

    useEffect(() => {
        setPlandData(plants)
    }, [plants])


    const addMorePlants = () => {
        navigation.navigate('AddPlantDetailsPlot', { id: plotID, })
    }
    function onChangeText(t: string): void {
        if (noResult) {
            setResult(false)
        }
        // Convert the search string to lowercase for case-insensitive matching
        const lowerCaseSearchString = t.toLowerCase();
        // Filter the array based on whether the name or species partially or fully matches the search string
        const searchData = plantData.filter(item =>
            item.tag.toLowerCase().includes(lowerCaseSearchString) ||
            item.scientificName.toLowerCase().includes(lowerCaseSearchString)
        );
        setPlandData(searchData)
        if (searchData.length === 0) {
            setResult(true)
        }
        if (t.length === 0) {
            setPlandData(plants)
        }
    }



    return (
        <View style={styles.container}>
            <FlatList
                ListHeaderComponent={<PlotPlantSearch onChangeText={onChangeText} />
                }
                ListEmptyComponent={<EmptyStaticScreen label={noResult ? "No searched result found" : 'No Plots to Show Yet'} note={'Tap the button below to add a new plant.'}
                    marginTop={{}}
                    image={<EmptyIcom />} />}
                ListFooterComponent={() => { return (<View style={{ width: '100%', height: 100 }} />) }}
                renderItem={({ item, index }) => (<PlantPlotCards item={item} handleSelection={handleSelection} index={index} />)}
                data={plantData}
            />
            <CustomButton
                label="Add Plants"
                containerStyle={styles.btnContainer}
                pressHandler={addMorePlants}
                showAdd
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
    emptyWrapper: {
        width: '100%',
        paddingTop: 100,
        justifyContent: "center",
        alignItems: 'center'
    },
    emptyLabel: {
        color: Colors.TEXT_LIGHT,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        fontSize: 15
    }
})

