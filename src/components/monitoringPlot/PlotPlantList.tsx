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
import EmptyIcon from 'assets/images/svg/EmptyGroupIcon.svg'
import PlotPlantSearch from './PlotPlantSearch'
import i18next from 'src/locales/index'

interface Props {
    plants: PlantedPlotSpecies[]
    plotID: string
}

const PlotPlantList = (props: Props) => {
    const { plants, plotID } = props;
    const [plantData, setPlantData] = useState<PlantedPlotSpecies[]>([])
    const [noResult, setNoResult] = useState(false)
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const handleSelection = (plantID: string) => {
        navigation.navigate('AddRemeasurement', { id: plotID, plantID: plantID })
    }

    useEffect(() => {
        setPlantData(plants)
    }, [plants])


    const addMorePlants = () => {
        navigation.navigate('AddPlantDetailsPlot', { id: plotID, })
    }
    function onChangeText(t: string): void {
        if (noResult) {
            setNoResult(false)
        }
        // Convert the search string to lowercase for case-insensitive matching
        const lowerCaseSearchString = t.toLowerCase();
        // Filter the array based on whether the name or species partially or fully matches the search string
        const searchData = plantData.filter(item =>
            item.tag.toLowerCase().includes(lowerCaseSearchString) ||
            item.scientificName.toLowerCase().includes(lowerCaseSearchString)
        );
        setPlantData(searchData)
        if (searchData.length === 0) {
            setNoResult(true)
        }
        if (t.length === 0) {
            setPlantData(plants)
        }
    }

    const renderFooter = () => { return (<View style={{ width: '100%', height: 100 }} />) }


    return (
        <View style={styles.container}>
            <FlatList
                ListHeaderComponent={<PlotPlantSearch onChangeText={onChangeText} />
                }
                ListEmptyComponent={<EmptyStaticScreen label={noResult ? i18next.t('label.no_search') : i18next.t('label.no_plants')} note={i18next.t('label.no_plant_note')}
                    marginTop={{}}
                    image={<EmptyIcon />} />}
                ListFooterComponent={renderFooter}
                renderItem={({ item }) => (<PlantPlotCards item={item} handleSelection={handleSelection} />)}
                data={plantData}
            />
            <CustomButton
                label={i18next.t('label.add_plants')}
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

