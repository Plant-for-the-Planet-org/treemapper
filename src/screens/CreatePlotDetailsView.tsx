import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import Header from 'src/components/common/Header'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Typography } from 'src/utils/constants'
import CustomButton from 'src/components/common/CustomButton'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import InfoIcon from 'assets/images/svg/InfoIcon.svg'
import OutlinedTextInput from 'src/components/common/OutlinedTextInput'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { PLOT_SHAPE } from 'src/types/type/app.type'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { MonitoringPlot, PlotGroups } from 'src/types/interface/slice.interface'
import { useToast } from 'react-native-toast-notifications'
import useMonitoringPlotMangement, { PlotDetailsParams } from 'src/hooks/realm/useMonitoringPlotMangement'
import AddPlotImage from 'src/components/monitoringPlot/AddPlotImage'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import CustomDropDownPicker from 'src/components/common/CustomDropDown'
import { DropdownData } from 'src/types/interface/app.interface'
import { AvoidSoftInput, AvoidSoftInputView } from 'react-native-avoid-softinput'
import { validateNumber } from 'src/utils/helpers/formHelper/validationHelper'
import i18next from 'src/locales/index'


const CreatePlotDetailsView = () => {
    const [plotName, setPlotName] = useState('');
    const [plotLength, setPlotLength] = useState('');
    const [plotWidth, setPlotWidth] = useState('');
    const [plotRadius, setPlotRadius] = useState('');
    const [plotShape, setPlotShape] = useState<PLOT_SHAPE>('CIRCULAR');
    const realm = useRealm()
    const { updatePlotDetails, addPlotToGroup } = useMonitoringPlotMangement()

    const route = useRoute<RouteProp<RootStackParamList, 'CreatePlotDetail'>>()
    const plotID = route.params && route.params.id ? route.params.id : ''
    const [plotImage, setPlotImage] = useState('')
    const { lastUpdateAt } = useSelector(
        (state: RootState) => state.monitoringPlotState,
    )
    const [type, setType] = useState<DropdownData>({
        label: '',
        value: '',
        index: 0
    })
    const [dropDownList, setDropDrownList] = useState<DropdownData[]>([])
    const toast = useToast()

    useEffect(() => {
        getPlotDetails()
    }, [plotID, lastUpdateAt])

    useEffect(() => {
        // This should be run when screen gains focus - enable the module where it's needed
        AvoidSoftInput.setShouldMimicIOSBehavior(true);
        return () => {
            // This should be run when screen loses focus - disable the module where it's not needed, to make a cleanup
            AvoidSoftInput.setShouldMimicIOSBehavior(false);
        };
    }, [])


    const getPlotDetails = () => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotID);
        if (plotData) {
            setPlotShape(plotData.shape)
            setPlotImage(plotData.local_image)
        } else {
            toast.show("No plot details found")
            navigation.goBack()
        }
        const groupData = realm.objects<PlotGroups>(RealmSchema.PlotGroups);
        if (groupData) {
            const updateList = groupData.map((el, i) => ({
                label: el.name,
                value: el.group_id,
                index: i
            }))
            setDropDrownList(updateList)
        }
    }

    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

    const submitHandler = async () => {
        if (plotName.trim().length === 0) {
            toast.show("Please add valid Plot Name")
            return
        }
        if (plotShape === 'RECTANGULAR') {
            const validWidth = validateNumber(plotWidth, 'width', 'width')
            const validHeight = validateNumber(plotLength, 'length', 'length')
            if (validHeight.hasError) {
                toast.show(validHeight.errorMessage)
                return
            }
            if (validWidth.hasError) {
                toast.show(validWidth.errorMessage)
                return
            }
            if (Number(plotWidth) < 4 || Number(plotLength) < 25) {
                toast.show("Please add valid Dimensions as per note")
                return
            }
        } else {
            const validRadius = validateNumber(plotRadius, 'Radius', 'Radius')
            if (!validRadius) {
                toast.show(validRadius.errorMessage)
                return
            }
            if (Number(plotRadius) < 25) {
                toast.show("Please add valid Radius as per note")
                return
            }
        }
        if (plotImage === '') {
            toast.show("Please add Plot Image")
            return
        }
        const data: PlotDetailsParams = {
            name: plotName,
            length: Number(plotLength),
            width: Number(plotWidth),
            radius: Number(plotRadius),
            group: null
        }
        const result = await updatePlotDetails(plotID, data)
        if (result) {
            if (type.value) {
                const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotID);
                await addPlotToGroup(type.value, plotData)
            }
            navigation.replace('CreatePlotMap', { id: plotID })
        } else {
            toast.show("Error occurred while adding data")
        }
    }

    const openInfo = () => {
        navigation.navigate('MonitoringInfo')
    }





    return (
        <SafeAreaView style={styles.container}>
            <AvoidSoftInputView
                avoidOffset={20}
                style={styles.container}>
                <Header label={i18next.t('label.create_plot_header')} rightComponet={<Pressable onPress={openInfo} style={styles.infoWrapper}><InfoIcon style={styles.infoWrapper} onPress={openInfo} /></Pressable>} />
                <ScrollView style={{ backgroundColor: Colors.BACKDROP_COLOR }}>
                    <View style={styles.wrapper}>
                        <View style={{ paddingHorizontal: 20 }}>
                            <AddPlotImage image={plotImage} plotID={plotID} />
                            <OutlinedTextInput
                                placeholder={i18next.t('label.plot_name')}
                                changeHandler={setPlotName}
                                keyboardType={'default'}
                                trailingtext={''}
                                errMsg={''} />
                            {plotShape == 'RECTANGULAR' ? <><OutlinedTextInput
                                placeholder={i18next.t('label.plot_length')}
                                changeHandler={setPlotLength}
                                keyboardType={'decimal-pad'}
                                trailingtext={'m'}
                                errMsg={''} />
                                <Text style={styles.noteWrapper}>
                                    {i18next.t('label.plot_radius_note')}
                                </Text>
                                <OutlinedTextInput
                                    placeholder={i18next.t('label.plot_width')}
                                    changeHandler={setPlotWidth}
                                    keyboardType={'decimal-pad'}
                                    trailingtext={'m'}
                                    errMsg={''} />
                                <Text style={styles.noteWrapper}>
                                    {i18next.t('label.plot_width_note')}
                                </Text></> : <><OutlinedTextInput
                                    placeholder={i18next.t('label.plot_radius')}
                                    changeHandler={setPlotRadius}
                                    keyboardType={'decimal-pad'}
                                    trailingtext={'m'}
                                    errMsg={''} /><Text style={styles.noteWrapper}>
                                    {i18next.t('label.plot_radius_note')}
                                </Text></>}
                        </View>
                        {dropDownList.length > 0 && <View style={{ marginLeft: '3%', width: '94%', justifyContent: 'center', alignItems: "center" }}>
                            <CustomDropDownPicker
                                label={i18next.t('label.plot_group_input')}
                                data={dropDownList}
                                onSelect={setType}
                                selectedValue={type}
                                position='top'
                            />
                        </View>}
                    </View>

                </ScrollView>
            </AvoidSoftInputView>
            <CustomButton
                label={i18next.t('label.create')}
                containerStyle={styles.btnContainer}
                pressHandler={submitHandler}
                hideFadein
            />
        </SafeAreaView >
    )
}

export default CreatePlotDetailsView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    },
    wrapper: {
        paddingTop: 20,
        paddingBottom: 100,
        height: '100%',
        width: '100%'
    },
    btnContainer: {
        width: '100%',
        height: scaleSize(70),
        position: 'absolute',
        bottom: 20,
    },
    infoWrapper: {
        marginRight: '5%'
    },
    noteWrapper: {
        marginHorizontal: '5%',
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_LIGHT,
        letterSpacing: 0.4,
        fontSize: scaleFont(14),
        marginBottom: 15
    }
})