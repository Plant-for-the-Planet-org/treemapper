import { StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import PlotPlantRemeasureHeader from 'src/components/monitoringPlot/PlotPlantRemeasureHeader'
import OutlinedTextInput from 'src/components/common/OutlinedTextInput'
import PlaceHolderSwitch from 'src/components/common/PlaceHolderSwitch'
import InterventionDatePicker from 'src/components/formBuilder/InterventionDatePicker'
import { Colors } from 'src/utils/constants'
import { BACKDROP_COLOR } from 'src/utils/constants/colors'
import CustomButton from 'src/components/common/CustomButton'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { MonitoringPlot, PlantTimeLine, PlantedPlotSpecies } from 'src/types/interface/slice.interface'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import useMonitoringPlotMangement from 'src/hooks/realm/useMonitoringPlotMangement'

const PlotPlantRemeasureView = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const route = useRoute<RouteProp<RootStackParamList, 'PlotPlantRemeasure'>>()
    const plotID = route.params && route.params.id ? route.params.id : ''
    const plantID = route.params && route.params.plantID ? route.params.plantID : ''
    const [selectedTimeline, setSelectedTimeLIne] = useState<PlantedPlotSpecies>(null)
    const [height, setHeight] = useState('')
    const [width, setWidth] = useState('')
    const [mesaurementDate, setMesaurmentDate] = useState(Date.now())
    const [isAlive, setIsAlive] = useState(true)
    const { addNewMeasurmentPlantPlots } = useMonitoringPlotMangement()
    const realm = useRealm()

    useEffect(() => {
        const plotDetails = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotID);
        if (plotDetails) {
            const getPlantDetails = plotDetails.plot_plants.find(el => el.plot_plant_id === plantID)
            if (getPlantDetails) {
                setSelectedTimeLIne(getPlantDetails)
            }
        }
    }, [plotID])

    const submitHadler = async () => {
        const updateTimeline: PlantTimeLine = {
            status: isAlive ? 'REMEASURMENT' : 'DESCEASED',
            length: Number(height),
            width: Number(width),
            date: mesaurementDate,
            length_unit: 'm',
            width_unit: 'cm',
            image: ''
        }
        await addNewMeasurmentPlantPlots(plotID, plantID, updateTimeline)
        navigation.goBack()
    }

    if (!selectedTimeline) {
        return null
    }

    return (
        <SafeAreaView style={styles.cotnainer}>
            <PlotPlantRemeasureHeader label={selectedTimeline.plot_plant_id} type={selectedTimeline.type} species={selectedTimeline.scientific_name} allias={selectedTimeline.aliases} showRemeasure={true} />
            <View style={styles.wrapper}>
                <PlaceHolderSwitch
                    description={'This tree is still alive'}
                    selectHandler={setIsAlive}
                    value={isAlive}
                />
                {isAlive && <><InterventionDatePicker
                    placeHolder={'Measurment Date'}
                    value={mesaurementDate}
                    callBack={setMesaurmentDate}
                />
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
                    </View></>}
            </View>
            <CustomButton
                label="Save"
                containerStyle={styles.btnContainer}
                pressHandler={submitHadler}
                hideFadein
            />
        </SafeAreaView>
    )
}

export default PlotPlantRemeasureView

const styles = StyleSheet.create({
    cotnainer: {
        flex: 1,
        backgroundColor: Colors.WHITE
    },
    wrapper: {
        backgroundColor: BACKDROP_COLOR,
        flex: 1,
        alignItems: 'center',
        paddingTop: 20
    },

    inputWrapper: {
        width: '95%'
    },
    btnContainer: {
        width: '100%',
        height: 70,
        position: 'absolute',
        bottom: 50,
    },
})