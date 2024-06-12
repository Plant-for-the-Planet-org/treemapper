import { StyleSheet, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import PlotPlantRemeasureHeader from 'src/components/monitoringPlot/PlotPlantRemeasureHeader'
import OutlinedTextInput from 'src/components/common/OutlinedTextInput'
import PlaceHolderSwitch from 'src/components/common/PlaceHolderSwitch'
import InterventionDatePicker from 'src/components/formBuilder/InterventionDatePicker'
import { Colors } from 'src/utils/constants'
import { BACKDROP_COLOR } from 'src/utils/constants/colors'
import CustomButton from 'src/components/common/CustomButton'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'

const PlotPlantRemeasureView = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const goBack=()=>{
        navigation.goBack()
    }
    return (
        <SafeAreaView style={styles.cotnainer}>
            <PlotPlantRemeasureHeader />
            <View style={styles.wrapper}>
                <PlaceHolderSwitch
                    description={'This tree is still alive'}
                    selectHandler={() => { }}
                    value={true}
                />
                <InterventionDatePicker
                    placeHolder={'Measurment Date'}
                    value={Date.now()}
                    callBack={() => { }}
                />
                <View style={styles.inputWrapper}>
                    <OutlinedTextInput
                        placeholder={'Height'}
                        changeHandler={() => { }}
                        keyboardType={'decimal-pad'}
                        trailingtext={'m'} errMsg={''} />
                </View>
                <View style={styles.inputWrapper}>
                    <OutlinedTextInput
                        placeholder={'Diameter'}
                        changeHandler={() => { }}
                        keyboardType={'decimal-pad'}
                        trailingtext={'cm'} errMsg={''} />
                </View>
            </View>
            <CustomButton
                label="Save"
                containerStyle={styles.btnContainer}
                pressHandler={goBack}
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