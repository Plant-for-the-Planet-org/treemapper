import { StyleSheet, View } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import OutlinedTextInput from 'src/components/common/OutlinedTextInput'
import InterventionDatePicker from 'src/components/formBuilder/InterventionDatePicker'
import { Colors } from 'src/utils/constants'
import { BACKDROP_COLOR } from 'src/utils/constants/colors'
import CustomButton from 'src/components/common/CustomButton'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import useMonitoringPlotMangement from 'src/hooks/realm/useMonitoringPlotMangement'
import { PlotObservation } from 'src/types/interface/slice.interface'
import { generateUniquePlotId } from 'src/utils/helpers/monitoringPlotHelper/monitoringRealmHelper'
import { OBSERVATION_TYPE } from 'src/types/type/app.type'
import Header from 'src/components/common/Header'
import CustomDropDownPicker from 'src/components/common/CustomDropDown'



const AllObservaiton: Array<{
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
        //  {
        //     label: 'Bioacusitcs',
        //     value: 'BIOACUSTICS',
        //     index: 0,
        //     unit: '',
        //     disabled: true
        // },
    ]



const AddObeservationForm = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const route = useRoute<RouteProp<RootStackParamList, 'AddObservationForm'>>()
    const plotID = route.params && route.params.id ? route.params.id : ''
    const [type, setType] = useState<{
        label: string
        value: OBSERVATION_TYPE
        index: number
    }
    >(AllObservaiton[0])
    const [observationDate, setObservationDate] = useState(Date.now())
    const [value, setValue] = useState('')
    const [unit, setUnit] = useState('kpa')

    const { addPlotObservation } = useMonitoringPlotMangement()

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


    const submitHadler = async () => {
        const obsDetails: PlotObservation = {
            obs_id: generateUniquePlotId(),
            type: type.value,
            obs_date: observationDate,
            value: Number(value),
            unit: unit
        }
        await addPlotObservation(plotID, obsDetails)
        navigation.goBack()
    }




    return (
        <SafeAreaView style={styles.cotnainer}>
            <Header label='Add Observation' />
            <View style={styles.wrapper}>
                <CustomDropDownPicker
                    label={'Project'}
                    data={AllObservaiton}
                    onSelect={handleDropDown}
                    selectedValue={type}
                />
                <InterventionDatePicker
                    placeHolder={'Observation Date'}
                    value={observationDate}
                    callBack={setObservationDate}
                />
                <View style={styles.inputWrapper}>
                    <OutlinedTextInput
                        placeholder={'Value'}
                        changeHandler={setValue}
                        keyboardType={'default'}
                        trailingtext={unit} errMsg={''} />
                </View>
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

export default AddObeservationForm

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