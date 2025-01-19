import { StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import OutlinedTextInput from 'src/components/common/OutlinedTextInput'
import InterventionDatePicker from 'src/components/formBuilder/InterventionDatePicker'
import { Colors } from 'src/utils/constants'
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
import CustomDatePicker from 'src/components/common/CustomDatePicker'
import { validateNumber } from 'src/utils/helpers/formHelper/validationHelper'



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
        }
    ]



const AddObservationForm = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const route = useRoute<RouteProp<RootStackParamList, 'AddObservationForm'>>()
    const plotID = route.params?.id ?? '';
    const obsId = route.params?.obsId ?? '';
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [type, setType] = useState<{
        label: string
        value: OBSERVATION_TYPE
        index: number
    }
    >(AllObservation[0])
    const [observationDate, setObservationDate] = useState(Date.now())
    const [value, setValue] = useState('')
    const [unit, setUnit] = useState('kpa')

    const { addPlotObservation, updatePlotObservation, deletePlotObservation } = useMonitoringPlotManagement()
    const toast = useToast()
    const realm = useRealm()

    useEffect(() => {
        if (obsId && obsId.length > 0) {
            const details = realm.objectForPrimaryKey<PlotObservation>(RealmSchema.PlotObservation, obsId);
            if (details) {
                setValue(String(details.value))
                setUnit(String(details.unit))
                setObservationDate(details.obs_date)
                setType({
                    label: details.type,
                    value: details.type,
                    index: 0
                })
            }
        }
    }, [obsId])


    const handleDropDown = (d: {
        label: string
        value: OBSERVATION_TYPE
        index: number
    }) => {
        if (d.value === 'SOIL_MOISTURE') {
            setUnit('kpa')
        }
        if (d.value === 'CANOPY') {
            setUnit('%')
        }
        setType(d)
    }


    const submitHandler = async () => {
        if (value.trim().length === 0) {
            toast.show("Please add valid Plot Value", { duration: 2000 })
            return
        }
        const updatedValue = value.replace(/,/g, '.');
        const validatedValue = validateNumber(updatedValue, 'value', 'Value')

        if (validatedValue.hasError) {
            toast.show(validatedValue.errorMessage)
            return null
        }

        const obsDetails: PlotObservation = {
            obs_id: generateUniquePlotId(),
            type: type.value,
            obs_date: observationDate,
            value: Number(updatedValue),
            unit: unit
        }
        await addPlotObservation(plotID, obsDetails)
        navigation.goBack()
    }

    const deleteHandler = async () => {
        const result = await deletePlotObservation(plotID, obsId)
        if (result) {
            toast.show("Observation deleted", { duration: 2000 })
            navigation.goBack()
        } else {
            toast.show("Error occurred while deleting", { duration: 2000 })
        }
    }

    const updateDetails = async () => {
        const obsDetails: PlotObservation = {
            obs_id: obsId,
            type: type.value,
            obs_date: observationDate,
            value: Number(value),
            unit: unit
        }
        const result = await updatePlotObservation(plotID, obsDetails)
        if (result) {
            toast.show("Observation details updated", { duration: 2000 })
            navigation.goBack()
        } else {
            toast.show("Error occurred while updating", { duration: 2000 })
        }
    }

    const handleDateSelection = (d: number) => {
        setObservationDate(d)
        setShowDatePicker(false)
    }

    const togglePicker = () => {
        setShowDatePicker(prev => !prev)
    }


    return (
        <SafeAreaView style={styles.container}>
            {showDatePicker && <CustomDatePicker cb={handleDateSelection}
                selectedData={observationDate}
            />}
            <Header label='Add Observation' />
            <View style={styles.wrapper}>
                {obsId.length === 0 && <CustomDropDownPicker
                    label={'Observation Type'}
                    data={AllObservation}
                    onSelect={handleDropDown}
                    selectedValue={type}
                />}
                <InterventionDatePicker
                    placeHolder={'Observation Date'}
                    value={observationDate}
                    showPicker={togglePicker}
                />
                <View style={styles.inputWrapper}>
                    <OutlinedTextInput
                        placeholder={'Value'}
                        changeHandler={setValue}
                        defaultValue={value}
                        keyboardType={'decimal-pad'}
                        trailingText={unit} errMsg={''} />
                </View>
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
})