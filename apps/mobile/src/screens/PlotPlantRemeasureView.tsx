import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import PlotPlantRemeasureHeader from 'src/components/monitoringPlot/PlotPlantRemeasureHeader'
import OutlinedTextInput from 'src/components/common/OutlinedTextInput'
import PlaceHolderSwitch from 'src/components/common/PlaceHolderSwitch'
import InterventionDatePicker from 'src/components/formBuilder/InterventionDatePicker'
import CustomDatePicker from 'src/components/common/CustomDatePicker'
import { Colors } from 'src/utils/constants'
import { BACKDROP_COLOR } from 'src/utils/constants/colors'
import CustomButton from 'src/components/common/CustomButton'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { MonitoringPlot, PlantTimeLine, PlantedPlotSpecies } from 'src/types/interface/slice.interface'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import useMonitoringPlotManagement from 'src/hooks/realm/useMonitoringPlotManagement'
import { usePostHog } from 'posthog-react-native'
import { captureAnalyticsEvent, AnalyticsEvents } from 'src/utils/analytics'
import { generateUniquePlotId } from 'src/utils/helpers/monitoringPlotHelper/monitoringRealmHelper'
import { scaleSize, scaleFont } from 'src/utils/constants/mixins'
import { useToast } from 'react-native-toast-notifications'
import { PLOT_PLANT_STATUS } from 'src/types/type/app.type'
import AddPlantImage from 'src/components/monitoringPlot/AddPlantImage'

interface Params {
    l: number,
    w: number,
    date: number,
    status: PLOT_PLANT_STATUS,
    image: string,
}

const PlotPlantRemeasureView = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const route = useRoute<RouteProp<RootStackParamList, 'AddRemeasurement'>>()
    const plotID = route.params?.id ?? '';
    const plantID = route.params?.plantID ?? '';
    const timelineId = route.params?.timelineId ?? '';
    const [selectedTimeline, setSelectedTimeline] = useState<PlantedPlotSpecies>(null)
    const [height, setHeight] = useState('')
    const [width, setWidth] = useState('')
    const [measurementDate, setMeasurementDate] = useState(Date.now())
    const [isAlive, setIsAlive] = useState(true)
    const [isEdit, setIsEdit] = useState(false)
    const [disableDelete, setDisableDelete] = useState(false)
    // A measurement that has already been uploaded is read-only on device.
    const [isLocked, setIsLocked] = useState(false)
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [timelineImage, setTimelineImage] = useState('')

    const toast = useToast()
    const posthog = usePostHog()
    const { addNewMeasurementPlantPlots, updateTimelineDetails, deletePlotTimeline } = useMonitoringPlotManagement()
    const realm = useRealm()

    useEffect(() => {
        const plotDetails = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotID);
        if (plotDetails) {
            const getPlantDetails = plotDetails.plot_plants.find(el => el.plot_plant_id === plantID)
            if (getPlantDetails) {
                setSelectedTimeline(getPlantDetails)
                if (timelineId) {
                    const timelineDetails = getPlantDetails.timeline.find(el => el.timeline_id === timelineId)
                    if (timelineDetails) {
                        setHeight(String(timelineDetails.length))
                        setWidth(String(timelineDetails.width))
                        setIsEdit(true)
                        setMeasurementDate(timelineDetails.date)
                        setIsAlive(timelineDetails.status !== 'DECEASED')
                        setDisableDelete(timelineDetails.status === 'PLANTED')
                        setIsLocked(timelineDetails.sync_status === 'SYNCED')
                        setTimelineImage(timelineDetails.image ?? '')
                    }
                }
            }
        }
    }, [plotID])

    const submitHandler = async () => {
        if (isLocked) {
            toast.show('This measurement is already synced and can\'t be changed.')
            return
        }
        if (isEdit) {
            updateDetails()
            return
        }
        if (isAlive) {
            if (height.length === 0) {
                toast.show('Height can not be empty')
                return
            }
            if (width.length === 0) {
                toast.show('Diameter can not be empty')
                return
            }
        }
        const updateTimeline: PlantTimeLine = {
            status: isAlive ? 'REMEASUREMENT' : 'DECEASED',
            length: Number(height),
            width: Number(width),
            date: measurementDate,
            length_unit: 'm',
            width_unit: 'cm',
            image: timelineImage,
            timeline_id: generateUniquePlotId(),
            sync_status: 'NOT_SYNCED',
        }
        await addNewMeasurementPlantPlots(plotID, plantID, updateTimeline)
        captureAnalyticsEvent(posthog, AnalyticsEvents.TREE_MONITORED, {
            plot_id: plotID,
            plant_id: plantID,
            status: updateTimeline.status,
        })
        navigation.goBack()
    }

    if (!selectedTimeline) {
        return null
    }

    const deleteHandler = async () => {
        if (isLocked) {
            toast.show('This measurement is already synced and can\'t be deleted.')
            return
        }
        const result = await deletePlotTimeline(plotID, plantID, timelineId)
        if (result) {
            toast.show("Data deleted.")
            navigation.goBack()
        } else {
            toast.show("Something went wrong.")
        }
    }

    const toggleDatePicker = () => {
        setShowDatePicker(prev => !prev)
    }

    const handleDateSelection = (n: number) => {
        if (!n) {
            setShowDatePicker(false)
            return
        }
        setMeasurementDate(n)
        setShowDatePicker(false)
    }

    const dateCheck = (index: number, newDate: number) => {
        if (index > 0 && newDate <= selectedTimeline.timeline[index - 1].date) {
            toast.show("Selected date cannot be less than the previous measurement.")
            return false
        }
        if (index < selectedTimeline.timeline.length - 1 && newDate >= selectedTimeline.timeline[index + 1].date) {
            toast.show("Selected date cannot be more than the next measurement.")
            return false
        }

        return true
    }

    const updateDetails = async () => {
        if (isLocked) {
            toast.show('This measurement is already synced and can\'t be changed.')
            return
        }
        const index = selectedTimeline.timeline.findIndex(el => el.timeline_id === timelineId)
        if (index === 0 && !isAlive) {
            toast.show("Planted Status cannot be marked as deceased.\nPlease create new measurement and mark it as deceased.")
            return
        }
        if (index !== selectedTimeline.timeline.length - 1 && !isAlive) {
            toast.show("Please delete all the other measurement next to this measurement before marking it deceased.")
            return
        }
        if (!dateCheck(index, measurementDate)) {
            return
        }
        const latestStatus = () => isAlive ? 'REMEASUREMENT' : 'DECEASED'
        const updateTimeline: Params = {
            l: Number(height),
            w: Number(width),
            date: measurementDate,
            status: isEdit && index === 0 ? 'PLANTED' : latestStatus(),
            image: timelineImage,
        }
        const result = await updateTimelineDetails(plotID, plantID, timelineId, updateTimeline)
        if (result) {
            toast.show("Details updated")
            navigation.goBack()
        } else {
            toast.show("Error occurred")
        }
    }
    return (
        <SafeAreaView style={styles.container}>
            <PlotPlantRemeasureHeader label={selectedTimeline.plot_plant_id} type={selectedTimeline.type} species={selectedTimeline.scientificName} showRemeasure={true} />
            {showDatePicker && <CustomDatePicker cb={handleDateSelection} selectedData={measurementDate || Date.now()} />}
            <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.wrapper}>
                <AddPlantImage
                    image={timelineImage}
                    screenType="REMEASUREMENT_IMAGE"
                    onImageCaptured={setTimelineImage}
                />
                <PlaceHolderSwitch
                    description={'This tree is still alive'}
                    selectHandler={setIsAlive}
                    value={isAlive}
                />
                {isAlive && <><InterventionDatePicker
                    placeHolder={'Measurement Date'}
                    value={measurementDate}
                    showPicker={toggleDatePicker}
                />
                    <View style={styles.inputWrapper}>
                        <OutlinedTextInput
                            placeholder={'Height'}
                            changeHandler={setHeight}
                            defaultValue={height}
                            keyboardType={'decimal-pad'}
                            trailingText={'m'} errMsg={''} />
                    </View>
                    <View style={styles.inputWrapper}>
                        <OutlinedTextInput
                            placeholder={'Diameter'}
                            changeHandler={setWidth}
                            keyboardType={'decimal-pad'}
                            defaultValue={width}
                            trailingText={'cm'} errMsg={''} />
                    </View></>}
            </View>
            </ScrollView>
            {isLocked ?
                <Text style={styles.lockedHint}>This measurement has been synced and can no longer be edited.</Text> :
                isEdit && !disableDelete ?
                <View style={styles.btnContainer}>
                    <CustomButton
                        label={'Delete'}
                        containerStyle={styles.btnWrapper}
                        pressHandler={deleteHandler}
                        wrapperStyle={styles.borderWrapper}
                        labelStyle={styles.highlightLabel}
                        hideFadeIn
                        disable={disableDelete}
                    />
                    <CustomButton
                        label={'Save'}
                        containerStyle={styles.btnWrapper}
                        pressHandler={updateDetails}
                        wrapperStyle={styles.noBorderWrapper}
                        hideFadeIn
                    />
                </View> :
                <CustomButton
                    label="Save"
                    containerStyle={styles.btnContainer}
                    pressHandler={submitHandler}
                    hideFadeIn
                />}
        </SafeAreaView>
    )
}

export default PlotPlantRemeasureView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    },
    scrollContent: {
        flexGrow: 1,
    },
    wrapper: {
        backgroundColor: BACKDROP_COLOR,
        flex: 1,
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 140,
    },

    inputWrapper: {
        width: '95%'
    },
    btnContainer: {
        width: '100%',
        height: 70,
        position: 'absolute',
        bottom: 50,
        flexDirection:'row'
    },
    lockedHint: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        textAlign: 'center',
        color: Colors.TEXT_LIGHT,
        fontSize: scaleFont(14),
        paddingHorizontal: 24,
    },
    btnMinorContainer: {
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
        width: '100%',
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
    normalLabel: {
        fontSize: scaleFont(14),
        fontWeight: '400',
        color: Colors.WHITE,
        textAlign: 'center',
    },
})