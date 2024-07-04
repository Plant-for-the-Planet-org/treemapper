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
import { generateUniquePlotId } from 'src/utils/helpers/monitoringPlotHelper/monitoringRealmHelper'
import { scaleSize, scaleFont } from 'src/utils/constants/mixins'
import { useToast } from 'react-native-toast-notifications'

const PlotPlantRemeasureView = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const route = useRoute<RouteProp<RootStackParamList, 'AddRemeasurment'>>()
    const plotID = route.params && route.params.id ? route.params.id : ''
    const plantID = route.params && route.params.plantID ? route.params.plantID : ''
    const timelineId = route.params && route.params.timelineId ? route.params.timelineId : ''
    const [selectedTimeline, setSelectedTimeLIne] = useState<PlantedPlotSpecies>(null)
    const [height, setHeight] = useState('')
    const [width, setWidth] = useState('')
    const [mesaurementDate, setMesaurmentDate] = useState(Date.now())
    const [isAlive, setIsAlive] = useState(true)
    const [isEdit, setIsEdit] = useState(false)
    const [disableDelte, setDisableDelte] = useState(false)

    const toast = useToast()
    const { addNewMeasurmentPlantPlots, updateTimelineDetails, deletePlotTimeline } = useMonitoringPlotMangement()
    const realm = useRealm()

    useEffect(() => {
        const plotDetails = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotID);
        if (plotDetails) {
            const getPlantDetails = plotDetails.plot_plants.find(el => el.plot_plant_id === plantID)
            if (getPlantDetails) {
                setSelectedTimeLIne(getPlantDetails)
                if (timelineId) {
                    const timelineDetails = getPlantDetails.timeline.find(el => el.timeline_id === timelineId)
                    if (timelineDetails) {
                        setHeight(String(timelineDetails.length))
                        setWidth(String(timelineDetails.width))
                        setIsEdit(true)
                        setMesaurmentDate(timelineDetails.date)
                        setIsAlive(timelineDetails.status !== 'DESCEASED')
                        setDisableDelte(timelineDetails.status === 'PLANTED')
                    }
                }
            }
        }
    }, [plotID])

    const submitHadler = async () => {
        if (isEdit) {
            updateDetails()
            return
        }
        if (height.length === 0) {
            toast.show('Height can not be empty')
            return
        }
        if (width.length === 0) {
            toast.show('Diameter can not be empty')
            return
        }
        const updateTimeline: PlantTimeLine = {
            status: isAlive ? 'REMEASURMENT' : 'DESCEASED',
            length: Number(height),
            width: Number(width),
            date: mesaurementDate,
            length_unit: 'm',
            width_unit: 'cm',
            image: '',
            timeline_id: generateUniquePlotId()
        }
        await addNewMeasurmentPlantPlots(plotID, plantID, updateTimeline)
        navigation.goBack()
    }

    if (!selectedTimeline) {
        return null
    }

    const deleteHandler = async () => {
        const result = await deletePlotTimeline(plotID, plantID, timelineId)
        if (result) {
            toast.show("Data deleted.")
            navigation.goBack()
        } else {
            toast.show("Something went wrong.")
        }
    }

    const dateCheck = (index: number, newDate: number) => {
        if (index > 0 && newDate <= selectedTimeline.timeline[index - 1].date) {
            toast.show("Selected date cannot be less than the previous measurment.")
            return false
        }
        if (index < selectedTimeline.timeline.length - 1 && newDate >= selectedTimeline.timeline[index + 1].date) {
            toast.show("Selected date cannot be more than the next measurment.")
            return false
        }

        return true
    }

    const updateDetails = async () => {
        const index = selectedTimeline.timeline.findIndex(el => el.timeline_id === timelineId)
        if (index === 0 && !isAlive) {
            toast.show("Planted Status cannot be marked as dseceased.\nPlease create new measurment and mark it as desceased.")
            return
        }
        if (index !== selectedTimeline.timeline.length - 1 && !isAlive) {
            toast.show("Please delete all the other measurement next to this measurment before marking it desceased.")
            return
        }
        if (!dateCheck(index, mesaurementDate)) {
            return
        }
        const updateTimeline = {
            l: Number(height),
            w: Number(width),
            date: mesaurementDate,
            status: isEdit && index === 0 ? 'PLANTED' : isAlive ? 'REMEASURMENT' : 'DESCEASED',
        }
        const result = await updateTimelineDetails(plotID, plantID, timelineId, updateTimeline)
        if (result) {
            toast.show("Details updated")
            navigation.goBack()
        } else {
            toast.show("Error occured")
        }
    }

    //todo

    return (
        <SafeAreaView style={styles.cotnainer}>
            <PlotPlantRemeasureHeader label={selectedTimeline.plot_plant_id} type={selectedTimeline.type} species={selectedTimeline.scientificName} allias={selectedTimeline.aliases} showRemeasure={true} />
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
                            defaultValue={height}
                            keyboardType={'decimal-pad'}
                            trailingtext={'m'} errMsg={''} />
                    </View>
                    <View style={styles.inputWrapper}>
                        <OutlinedTextInput
                            placeholder={'Diameter'}
                            changeHandler={setWidth}
                            keyboardType={'decimal-pad'}
                            defaultValue={width}
                            trailingtext={'cm'} errMsg={''} />
                    </View></>}
            </View>
            {isEdit && !disableDelte ?
                <View style={styles.btnContainedr}>
                    <CustomButton
                        label={'Delete'}
                        containerStyle={styles.btnWrapper}
                        pressHandler={deleteHandler}
                        wrapperStyle={styles.borderWrapper}
                        labelStyle={styles.highlightLabel}
                        hideFadein
                        disable={disableDelte}
                    />
                    <CustomButton
                        label={'Save'}
                        containerStyle={styles.btnWrapper}
                        pressHandler={updateDetails}
                        wrapperStyle={styles.noBorderWrapper}
                        hideFadein
                    />
                </View> :
                <CustomButton
                    label="Save"
                    containerStyle={styles.btnContainer}
                    pressHandler={submitHadler}
                    hideFadein
                />}
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
    btnContainedr: {
        width: '100%',
        height: scaleSize(70),
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        bottom: 30,
        justifyContent: 'center'
    },
    btnWrapper: {
        width: '48%',
    },
    imageContainer: {
        widht: '100%',
        height: '100%',
    },
    borderWrapper: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 5,
        width: '90%',
        height: '80%',
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'tomato'
    },
    noBorderWrapper: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 5,
        width: '90%',
        height: '80%',
        backgroundColor: Colors.PRIMARY_DARK,
        borderRadius: 12,
    },
    opaqueWrapper: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 5,
        width: '90%',
        height: '70%',
        backgroundColor: Colors.PRIMARY_DARK,
        borderRadius: 10,
    },
    highlightLabel: {
        fontSize: scaleFont(16),
        fontWeight: '400',
        color: 'tomato'
    },
    normalLable: {
        fontSize: scaleFont(14),
        fontWeight: '400',
        color: Colors.WHITE,
        textAlign: 'center',
    },
})