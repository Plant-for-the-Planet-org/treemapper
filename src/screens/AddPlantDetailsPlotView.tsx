import { StyleSheet, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from 'src/components/common/Header'
import { Colors } from 'src/utils/constants'
import CustomButton from 'src/components/common/CustomButton'
import OutlinedTextInput from 'src/components/common/OutlinedTextInput'
import PlaceHolderSwitch from 'src/components/common/PlaceHolderSwitch'
import InterventionDatePicker from 'src/components/formBuilder/InterventionDatePicker'
import CustomDropDown from 'src/components/common/CustomDropDown'

const AddPlantDetailsPlotView = () => {
    return (
        <SafeAreaView style={styles.container}>
            <Header label='Add Plant' />
            <View style={styles.wrapper}>
                <InterventionDatePicker
                    placeHolder={'Measurment Date'}
                    value={Date.now()}
                    callBack={() => { }}
                />
                <View style={styles.dropDownWrappper}>
                    <CustomDropDown
                        label={'Site'}
                        data={[{
                            label: '',
                            value: 'el.id',
                            index: 0,
                        }]}
                        onSelect={() => null}
                        selectedValue={{
                            label: 'InterventionFormData.site_name',
                            value: 'InterventionFormData.site_id,,',
                            index: 0,
                        }}
                    />
                </View>
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
                        placeholder={'Tag'}
                        changeHandler={() => { }}
                        keyboardType={'decimal-pad'}
                        trailingtext={'m'} errMsg={''} />
                </View>
            </View>
            <CustomButton
                label="Save"
                containerStyle={styles.btnContainer}
                pressHandler={() => { }}
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
    wrapper: {
        flex: 1,
        backgroundColor: Colors.BACKDROP_COLOR,
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
        bottom: 20,
    },
    dropDownWrappper: {
        width: '98%'
    },
})