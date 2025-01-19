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
import useMonitoringPlotManagement, { PlotDetailsParams } from 'src/hooks/realm/useMonitoringPlotManagement'
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
    const { updatePlotDetails, addPlotToGroup } = useMonitoringPlotManagement()

    const route = useRoute<RouteProp<RootStackParamList, 'CreatePlotDetail'>>()
    const plotID = route.params?.id ?? '';
    const [plotImage, setPlotImage] = useState('')
    const { lastUpdateAt } = useSelector(
        (state: RootState) => state.monitoringPlotState,
    )
    const [type, setType] = useState<DropdownData>({
        label: '',
        value: '',
        index: 0
    })
    const [dropDownList, setDropDownList] = useState<DropdownData[]>([])
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
            setDropDownList(updateList)
        }
    }

    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

    const validatePlotDimensions = (plotShape: string) => {
        if (plotShape === 'RECTANGULAR') {
            return isRectangularPlotValid(plotWidth, plotLength);
        }
        if (plotShape === 'CIRCULAR') {
            if (!isCircularPlotValid(plotRadius)) return false;
        }
        return true
    };

    const submitHandler = async () => {
        if (!isPlotNameValid(plotName)) {
            toast.show("Please add valid Plot Name",{duration:2000})
            return;
        }

        if (!validatePlotDimensions(plotShape)) return;
        const updatedWidth = plotWidth.replace(/,/g, '.');
        const updatedLength = plotLength.replace(/,/g, '.');
        const updatedRadius = plotRadius.replace(/,/g, '.');
        const data: PlotDetailsParams = {
            name: plotName,
            length: Number(updatedLength),
            width: Number(updatedWidth),
            radius: Number(updatedRadius),
            group: null
        };

        const result = await updatePlotDetails(plotID, data);
        if (result) {
            await handlePostUpdate();
            navigation.replace('CreatePlotMap', { id: plotID });
        } else {
            toast.show("Error occurred while adding data",{duration:2000})
        }
    };


    const isPlotNameValid = (name: string) => name.trim().length > 0;

    const isRectangularPlotValid = (width: string, length: string) => {
        const updatedWidth = width.replace(/,/g, '.');
        const updatedLength = length.replace(/,/g, '.');
        const validWidth = validateNumber(updatedWidth, 'width', 'width');
        const validHeight = validateNumber(updatedLength, 'length', 'length');
        if (validHeight.hasError) {
            toast.show(validHeight.errorMessage);
            return false;
        }
        if (validWidth.hasError) {
            toast.show(validWidth.errorMessage);
            return false;
        }
        if (Number(updatedWidth) < 0 || Number(updatedLength) < 0) {
            toast.show("Please add valid Dimensions",{duration:2000})
            return false;
        }
        return true;
    };

    const isCircularPlotValid = (radius: string) => {
        const updatedRadius = radius.replace(/,/g, '.');
        const validRadius = validateNumber(updatedRadius, 'Radius', 'Radius');
        if (validRadius.hasError) {
            toast.show(validRadius.errorMessage,{duration:2000})
            return false;
        }
        if (Number(updatedRadius) < 0) {
            toast.show("Please add valid Radius",{duration:2000})
            return false;
        }
        return true;
    };

    const handlePostUpdate = async () => {
        if (type.value) {
            const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotID);
            await addPlotToGroup(type.value, plotData);
        }
    };

    const openInfo = () => {
        navigation.navigate('MonitoringInfo')
    }


    return (
        <SafeAreaView style={styles.container}>
            <Header label={i18next.t('label.create_plot_header')} rightComponent={<Pressable onPress={openInfo} style={styles.infoWrapper}><InfoIcon style={styles.infoWrapper} onPress={openInfo} /></Pressable>} />
            <ScrollView style={{ backgroundColor: Colors.BACKDROP_COLOR }}>
                <AvoidSoftInputView
                    avoidOffset={20}
                    showAnimationDuration={200}
                    style={styles.container}>
                    <View style={styles.wrapper}>
                        <View style={{ paddingHorizontal: '3%' }}>
                            <AddPlotImage image={plotImage} plotID={plotID} />
                            <OutlinedTextInput
                                placeholder={i18next.t('label.plot_name')}
                                changeHandler={setPlotName}
                                keyboardType={'default'}
                                trailingText={''}
                                errMsg={''} />
                            {plotShape == 'RECTANGULAR' ? <><OutlinedTextInput
                                placeholder={i18next.t('label.plot_length')}
                                changeHandler={setPlotLength}
                                keyboardType={'decimal-pad'}
                                trailingText={'m'}
                                errMsg={''} />
                                <Text style={styles.noteWrapper}>
                                    {i18next.t('label.plot_radius_note')}
                                </Text>
                                <OutlinedTextInput
                                    placeholder={i18next.t('label.plot_width')}
                                    changeHandler={setPlotWidth}
                                    keyboardType={'decimal-pad'}
                                    trailingText={'m'}
                                    errMsg={''} />
                                <Text style={styles.noteWrapper}>
                                    {i18next.t('label.plot_width_note')}
                                </Text></> : <><OutlinedTextInput
                                    placeholder={i18next.t('label.plot_radius')}
                                    changeHandler={setPlotRadius}
                                    keyboardType={'decimal-pad'}
                                    trailingText={'m'}
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
                </AvoidSoftInputView>
            </ScrollView>
            <CustomButton
                label={i18next.t('label.create')}
                containerStyle={styles.btnContainer}
                wrapperStyle={{ width: '92%' }}
                pressHandler={submitHandler}
                hideFadeIn
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
        width: '100%',
        backgroundColor: Colors.BACKDROP_COLOR
    },
    btnContainer: {
        width: '100%',
        height: scaleSize(70),
        position: 'absolute',
        bottom: 30,
    },
    infoWrapper: {
        marginRight: '3%'
    },
    noteWrapper: {
        marginHorizontal: '3%',
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_LIGHT,
        letterSpacing: 0.4,
        fontSize: scaleFont(14),
        marginBottom: 15
    }
})