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
import { MonitoringPlot } from 'src/types/interface/slice.interface'
import { useToast } from 'react-native-toast-notifications'
import useMonitoringPlotMangement, { PlotDetailsParams } from 'src/hooks/realm/useMonitoringPlotMangement'
import AddPlotImage from 'src/components/monitoringPlot/AddPlotImage'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'

const CreatePlotDetailsView = () => {
    const [plotName, setPlotName] = useState('');
    const [plotLength, setPlotLength] = useState('');
    const [plotWidth, setPlotWidth] = useState('');
    // const [plotGroup, setPlotGroup] = useState('');
    const [plotRadius, setPlotRadius] = useState('');
    const [plotShape, setPlotShape] = useState<PLOT_SHAPE>('CIRCULAR');
    const realm = useRealm()
    const { updatePlotDetails } = useMonitoringPlotMangement()
    const route = useRoute<RouteProp<RootStackParamList, 'CreatePlotDetail'>>()
    const plotID = route.params && route.params.id ? route.params.id : ''
    const [plotImage, setPlotImage] = useState('')
    const { lastUpdateAt } = useSelector(
        (state: RootState) => state.monitoringPlotState,
    )


    const toast = useToast()
    useEffect(() => {
        getPlotDetails()
    }, [plotID, lastUpdateAt])

    const getPlotDetails = () => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotID);
        if (plotData) {
            setPlotShape(plotData.shape)
            setPlotImage(plotData.local_image)
        } else {
            toast.show("No plot details found")
            navigation.goBack()
        }
    }


    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const submitHandler = async () => {
        const data: PlotDetailsParams = {
            name: plotName,
            length: Number(plotLength),
            width: Number(plotWidth),
            radius: Number(plotRadius),
            group: null
        }
        const result = await updatePlotDetails(plotID, data)
        if (result) {
            navigation.navigate('CreatePlotMap', { id: plotID })
        } else {
            toast.show("Error occured while adding data")
        }
    }
    const openInfo = () => {
        navigation.navigate('MonitoringInfo')
    }
    return (
        <SafeAreaView style={styles.container}>
            <Header label='Create Plot' rightComponet={<Pressable onPress={openInfo} style={styles.infoWrapper}><InfoIcon style={styles.infoWrapper} onPress={openInfo} /></Pressable>} />
            <ScrollView>
                <View style={styles.wrapper}>
                    <AddPlotImage image={plotImage} plotID={plotID} />
                    <OutlinedTextInput
                        placeholder={'Plot Name'}
                        changeHandler={setPlotName}
                        keyboardType={'default'}
                        trailingtext={''}
                        errMsg={''} />
                    {plotShape === 'RECTANGULAR' ? <><OutlinedTextInput
                        placeholder={'Plot Length'}
                        changeHandler={setPlotLength}
                        keyboardType={'decimal-pad'}
                        trailingtext={'m'}
                        errMsg={''} />
                        <Text style={styles.noteWrapper}>
                            25 meters or more recommended
                        </Text>
                        <OutlinedTextInput
                            placeholder={'Plot Width'}
                            changeHandler={setPlotWidth}
                            keyboardType={'decimal-pad'}
                            trailingtext={'m'}
                            errMsg={''} />
                        <Text style={styles.noteWrapper}>
                            4 meters or more recommended
                        </Text></> : <><OutlinedTextInput
                            placeholder={'Plot Radius'}
                            changeHandler={setPlotRadius}
                            keyboardType={'decimal-pad'}
                            trailingtext={'m'}
                            errMsg={''} /><Text style={styles.noteWrapper}>
                            25 meters or more recommended
                        </Text></>}
                    {/* <OutlinedTextInput
                    placeholder={'Plot Group (Optional)'}
                    changeHandler={setPlotGroup}
                    keyboardType={'decimal-pad'}
                    trailingtext={''}
                    errMsg={''} /> */}
                </View>
            </ScrollView>
            <CustomButton
                label="Create"
                containerStyle={styles.btnContainer}
                pressHandler={submitHandler}
                hideFadein
            />
        </SafeAreaView>
    )
}

export default CreatePlotDetailsView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    },
    wrapper: {
        flex: 1,
        backgroundColor: Colors.BACKDROP_COLOR,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom:100
    },
    btnContainer: {
        width: '100%',
        height: scaleSize(70),
        position: 'absolute',
        bottom: 50,
    },
    infoWrapper: {
        marginRight: '5%'
    },
    noteWrapper: {
        marginHorizontal: '5%',
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_COLOR,
        letterSpacing: 0.4,
        fontSize: scaleFont(14),
        marginBottom: 15
    }
})