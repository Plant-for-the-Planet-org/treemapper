import { StyleSheet, View, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import OutlinedTextInput from 'src/components/common/OutlinedTextInput'
import InterventionDatePicker from 'src/components/formBuilder/InterventionDatePicker'
import CustomDatePicker from 'src/components/common/CustomDatePicker'
import { Colors, Typography } from 'src/utils/constants'
import { BACKDROP_COLOR } from 'src/utils/constants/colors'
import CustomButton from 'src/components/common/CustomButton'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import useMonitoringPlotManagement from 'src/hooks/realm/useMonitoringPlotManagement'
import { PlotObservation } from 'src/types/interface/slice.interface'
import { generateUniquePlotId } from 'src/utils/helpers/monitoringPlotHelper/monitoringRealmHelper'
import { OBSERVATION_TYPE } from 'src/types/type/app.type'
import Header from 'src/components/common/Header'
import CustomDropDownPicker from 'src/components/common/CustomDropDown'
import { useToast } from 'react-native-toast-notifications'
import { scaleSize, scaleFont } from 'src/utils/constants/mixins'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import Switch from 'src/components/common/Switch'



const AllObservation: Array<{
    label: string
    value: OBSERVATION_TYPE
    index: number
}> = [
        {
            label: 'Soil Moisture',
            value: 'SOIL_MOISTURE',
            index: 0,
        },
        {
            label: 'Canopy Cover',
            value: 'CANOPY',
            index: 0,
        },
        {
            label: 'Plot description',
            value: 'PLOT_DESCRIPTION',
            index: 0,
        },
        {
            label: 'Grass cover',
            value: 'GRASS_COVER',
            index: 0,
        },
    ]



const DEFAULT_UNITS: Partial<Record<OBSERVATION_TYPE, string>> = {
    SOIL_MOISTURE: 'kpa',
    CANOPY: '%',
}

const AddObservationForm = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const route = useRoute<RouteProp<RootStackParamList, 'AddObservationForm'>>()
    const plotID = route.params?.id ?? '';
    const obsId = route.params?.obsId ?? '';

    const [type, setType] = useState<{
        label: string
        value: OBSERVATION_TYPE
        index: number
    }
    >(AllObservation[0])
    const [observationDate, setObservationDate] = useState(Date.now())
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [value, setValue] = useState('')
    const [unit, setUnit] = useState('kpa')
    const [advancedMode, setAdvancedMode] = useState(false)
    const [customUnit, setCustomUnit] = useState('')

    const { addPlotObservation, updatePlotObservation, deletePlotObservation } = useMonitoringPlotManagement()
    const toast = useToast()
    const realm = useRealm()

    useEffect(() => {
        if (obsId && obsId.length > 0) {
            const details = realm.objectForPrimaryKey<PlotObservation>(RealmSchema.PlotObservation, obsId);
            if (details) {
                const storedUnit = String(details.unit)
                setValue(String(details.value))
                setObservationDate(details.obs_date)
                setType({
                    label: details.type,
                    value: details.type,
                    index: 0
                })
                const defaultUnit = DEFAULT_UNITS[details.type as OBSERVATION_TYPE] ?? ''
                if (storedUnit && storedUnit !== defaultUnit) {
                    setAdvancedMode(true)
                    setCustomUnit(storedUnit)
                } else {
                    setUnit(storedUnit)
                }
            }
        }
    }, [obsId])


    const handleDropDown = (d: {
        label: string
        value: OBSERVATION_TYPE
        index: number
    }) => {
        if (!advancedMode) {
            setUnit(DEFAULT_UNITS[d.value] ?? '')
        }
        setType(d)
    }

    const toggleDatePicker = () => setShowDatePicker(prev => !prev)

    const handleDateSelection = (n: number) => {
        if (!n) {
            setShowDatePicker(false)
            return
        }
        setObservationDate(n)
        setShowDatePicker(false)
    }

    const handleAdvancedModeToggle = () => {
        const next = !advancedMode
        setAdvancedMode(next)
        if (!next) {
            // revert to the default unit for the current type
            setUnit(DEFAULT_UNITS[type.value] ?? '')
            setCustomUnit('')
        }
    }

    const activeUnit = advancedMode ? customUnit : unit


    const submitHandler = async () => {
        if (value.trim().length === 0) {
            toast.show("Please add valid Plot Name")
            return
        }
        const obsDetails: PlotObservation = {
            obs_id: generateUniquePlotId(),
            type: type.value,
            obs_date: observationDate,
            value: Number(value),
            unit: activeUnit
        }
        await addPlotObservation(plotID, obsDetails)
        navigation.goBack()
    }

    const deleteHandler = async () => {
        const result = await deletePlotObservation(plotID, obsId)
        if (result) {
            toast.show("Observation deleted")
            navigation.goBack()
        } else {
            toast.show("Error occurred while deleting")
        }
    }

    const updateDetails = async () => {
        const obsDetails: PlotObservation = {
            obs_id: obsId,
            type: type.value,
            obs_date: observationDate,
            value: Number(value),
            unit: activeUnit
        }
        const result = await updatePlotObservation(plotID, obsDetails)
        if (result) {
            toast.show("Observation details updated")
            navigation.goBack()
        } else {
            toast.show("Error occurred while updating")
        }
    }



    return (
        <SafeAreaView style={styles.container}>
            <Header label='Add Observation' />
            {showDatePicker && <CustomDatePicker cb={handleDateSelection} selectedData={observationDate || Date.now()} />}
            <View style={styles.wrapper}>
                <CustomDropDownPicker
                    label={'Observation type'}
                    data={AllObservation}
                    onSelect={handleDropDown}
                    selectedValue={type}
                />
                <InterventionDatePicker
                    placeHolder={'Observation Date'}
                    value={observationDate}
                    showPicker={toggleDatePicker}
                />
                <View style={styles.inputWrapper}>
                    <OutlinedTextInput
                        placeholder={'Value'}
                        changeHandler={setValue}
                        defaultValue={value}
                        keyboardType={'decimal-pad'}
                        trailingText={activeUnit} errMsg={''} />
                </View>
                <View style={styles.advancedRow}>
                    <Text style={styles.advancedLabel}>Custom unit</Text>
                    <Switch
                        value={advancedMode}
                        onValueChange={handleAdvancedModeToggle}
                        disabled={false}
                    />
                </View>
                {advancedMode && (
                    <View style={styles.inputWrapper}>
                        <OutlinedTextInput
                            placeholder={'Unit (e.g. ppm, °C)'}
                            changeHandler={setCustomUnit}
                            defaultValue={customUnit}
                            keyboardType={'default'}
                            trailingText={''} errMsg={''} />
                    </View>
                )}
            </View>
            {obsId && obsId.length > 0 ?
                <View style={styles.btnMinorContainer}>
                    <CustomButton
                        label={'Delete'}
                        containerStyle={styles.btnWrapper}
                        pressHandler={deleteHandler}
                        wrapperStyle={styles.borderWrapper}
                        labelStyle={styles.highlightLabel}
                        hideFadeIn
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

export default AddObservationForm

const styles = StyleSheet.create({
    container: {
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
    advancedRow: {
        width: '95%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginBottom: 8,
    },
    advancedLabel: {
        fontSize: scaleFont(14),
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR,
    },
})