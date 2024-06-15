import { ScrollView, StyleSheet, View } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from 'src/components/common/Header'
import { Colors } from 'src/utils/constants'
import CustomButton from 'src/components/common/CustomButton'
import OutlinedTextInput from 'src/components/common/OutlinedTextInput'
import PlaceHolderSwitch from 'src/components/common/PlaceHolderSwitch'
import InterventionDatePicker from 'src/components/formBuilder/InterventionDatePicker'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import StaticOutlineInput from 'src/components/formBuilder/StaticOutlineInput'
import PlantPlotListModal from 'src/components/monitoringPlot/PlotSpeciesList'
import { PlantTimeLine, PlantedPlotSpecies } from 'src/types/interface/slice.interface'
import useMonitoringPlotMangement from 'src/hooks/realm/useMonitoringPlotMangement'
import { useRoute, RouteProp } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { generateUniquePlotId } from 'src/utils/helpers/monitoringPlotHelper/monitoringRealmHelper'


const AddPlantDetailsPlotView = () => {
    const route = useRoute<RouteProp<RootStackParamList, 'CreatePlotDetail'>>()
    const plotID = route.params && route.params.id ? route.params.id : ''
    const [isPlanted, setIsPlanted] = useState(true)
    const [mesaurmentDate, setIsMeasurmentDate] = useState(Date.now())
    const [species, setSpecies] = useState<IScientificSpecies | null>(null)
    const [height, setHeight] = useState('')
    const [width, setWidth] = useState('')
    const [isTreeAlive, setIsTreeAlive] = useState(true)
    const [plantingDate, setPlantingDate] = useState(Date.now())
    const [tag, setTag] = useState('')
    const [speciesModal, setShowSpeciesModal] = useState(false)
    const { addPlantDetailsPlot } = useMonitoringPlotMangement()
    const toogleSpeciesModal = () => {
        setShowSpeciesModal(!speciesModal)
    }


    const getSpeciesNames = () => {
        return species ? `${species.aliases.length > 0 ? species.aliases : ''}  ${species.scientific_name}` : 'Select Species'
    }

    const submitHandler = async () => {
        const plantTimeline: PlantTimeLine = {
            status: !isTreeAlive ? 'DESCEASED' : isPlanted ? 'PLANTED' : 'RECRUIT',
            length: Number(height),
            width: Number(width),
            date: mesaurmentDate,
            length_unit: 'm',
            width_unit: 'cm',
            image: ''
        }
        const plantDetails: PlantedPlotSpecies = {
            plot_plant_id: generateUniquePlotId(),
            tag: tag,
            guid: species.guid,
            scientific_name: species.scientific_name,
            aliases: species.aliases,
            count: 1,
            image: species.image,
            timeline: [plantTimeline],
            planting_date: plantingDate,
            is_alive: isTreeAlive,
            type: isPlanted ? 'PLANTED' : 'RECRUIT',
            details_updated_at: Date.now()
        }
        await addPlantDetailsPlot(plotID, plantDetails)
    }


    return (
        <SafeAreaView style={styles.container}>
            <Header label='Add Plant' />
            <ScrollView>
                <PlantPlotListModal isVisible={speciesModal} toogleModal={toogleSpeciesModal} setSpecies={setSpecies} />
                <View style={styles.wrapper}>
                    <PlaceHolderSwitch
                        description={'This tree was planted'}
                        selectHandler={setIsPlanted}
                        value={isPlanted}
                    />
                    <InterventionDatePicker
                        placeHolder={'Measurment Date'}
                        value={mesaurmentDate}
                        callBack={setIsMeasurmentDate}
                    />
                    <StaticOutlineInput placeHolder={'Species'} value={getSpeciesNames()} callBack={toogleSpeciesModal} />
                    <View style={styles.inputWrapper}>
                        <OutlinedTextInput
                            placeholder={'Height'}
                            changeHandler={setHeight}
                            keyboardType={'decimal-pad'}
                            trailingtext={'m'} errMsg={''} />
                    </View>
                    <View style={styles.inputWrapper}>
                        <OutlinedTextInput
                            placeholder={'Diameter'}
                            changeHandler={setWidth}
                            keyboardType={'decimal-pad'}
                            trailingtext={'cm'} errMsg={''} />
                    </View>
                    <PlaceHolderSwitch
                        description={'This tree is still alive'}
                        selectHandler={setIsTreeAlive}
                        value={isTreeAlive}
                    />
                    <InterventionDatePicker
                        placeHolder={'Measurment Date'}
                        value={plantingDate}
                        callBack={setPlantingDate}
                    />
                    <View style={styles.inputWrapper}>
                        <OutlinedTextInput
                            placeholder={'Tag'}
                            changeHandler={setTag}
                            keyboardType={'decimal-pad'}
                            trailingtext={''} errMsg={''} />
                    </View>
                </View>
            </ScrollView>
            <CustomButton
                label="Save"
                containerStyle={styles.btnContainer}
                pressHandler={submitHandler}
                hideFadein
            />
        </SafeAreaView>
    )
}

export default AddPlantDetailsPlotView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    },
    scrollWrapper: {

    },
    wrapper: {
        flex: 1,
        backgroundColor: Colors.BACKDROP_COLOR,
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 100
    },
    inputWrapper: {
        width: '95%'
    },
    btnContainer: {
        width: '100%',
        height: 70,
        position: 'absolute',
        bottom: 20,
    },
    dropDownWrappper: {
        width: '98%',
        justifyContent: "center",
        alignItems: 'center'
    },
    staticInputContainer: {
        width: '92%',
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        backgroundColor: Colors.WHITE
    }
})