import { Pressable, StyleSheet, View } from 'react-native'
import React, { useState } from 'react'
import Header from 'src/components/common/Header'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import CreatePlotCard from 'src/components/monitoringPlot/CreatePlotCard'
import CustomButton from 'src/components/common/CustomButton'
import { scaleSize } from 'src/utils/constants/mixins'
import InfoIcon from 'assets/images/svg/InfoIcon.svg'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useNavigation } from '@react-navigation/native'
import useMonitoringPlotMangement from 'src/hooks/realm/useMonitoringPlotMangement'
import { newPlotDetails } from 'src/utils/helpers/monitoringPlotHelper/monitoringRealmHelper'
import { PLOT_TYPE, PLOT_SHAPE, PLOT_COMPLEXITY } from 'src/types/type/app.type'
import { useToast } from 'react-native-toast-notifications'

const CreatePlotView = () => {
    const [plotType, setPlotType] = useState<PLOT_TYPE | any>('INTERVENTION');
    const [plotShape, setPlotShape] = useState<PLOT_SHAPE | any>('CIRCULAR');
    const [plotComplexity, setPlotComplexity] = useState<PLOT_COMPLEXITY | any>('STANDARD');

    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const { initateNewPlot } = useMonitoringPlotMangement()
    const toast = useToast()

    const handleNav = async () => {
        const details = newPlotDetails(plotShape, plotType, plotComplexity)
        const result = await initateNewPlot(details)
        if (result) {
            navigation.replace('CreatePlotDetail', { id: details.plot_id })
        } else {
            toast.show("Error while cretaing plots")
        }
    }

    const openInfo = () => {
        navigation.navigate('MonitoringInfo')
    }

    return (
        <SafeAreaView style={styles.container}>
            <Header label='Create Plot' rightComponet={<Pressable onPress={openInfo} style={styles.infoWrapper}><InfoIcon style={styles.infoWrapper} onPress={openInfo} /></Pressable>} />
            <View style={styles.wrapper}>
                <CreatePlotCard header={'Plot Complexity'} labelOne={{
                    key: 'STANDARD',
                    value: 'Standard'
                }} labelTwo={{
                    key: 'SIMPLE',
                    value: 'Simple'
                }} disabled={true}
                    selectedValue={plotComplexity}
                    onSelect={setPlotComplexity}
                />
                <CreatePlotCard header={'Plot Shape'} labelOne={{
                    key: 'RECTANGULAR',
                    value: 'Rectangular'
                }} labelTwo={{
                    key: 'CIRCULAR',
                    value: 'Circular'
                }} disabled={false}
                    selectedValue={plotShape}
                    onSelect={setPlotShape} />
                <CreatePlotCard header={'Plot type'} labelOne={{
                    key: 'INTERVENTION',
                    value: 'Intervention'
                }} labelTwo={{
                    key: 'CONTROL',
                    value: 'Control'
                }} disabled={false}
                    selectedValue={plotType}
                    onSelect={setPlotType} />
            </View>
            <CustomButton
                label="Continue"
                containerStyle={styles.btnContainer}
                pressHandler={handleNav}
                hideFadein
            />
        </SafeAreaView>
    )
}

export default CreatePlotView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    },
    wrapper: {
        flex: 1,
        backgroundColor: Colors.BACKDROP_COLOR
    },
    btnContainer: {
        width: '100%',
        height: scaleSize(70),
        position: 'absolute',
        bottom: 50,
    },
    infoWrapper: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: '5%'
    }
})
