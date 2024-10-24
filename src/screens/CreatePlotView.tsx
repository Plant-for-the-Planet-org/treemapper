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
import useMonitoringPlotManagement from 'src/hooks/realm/useMonitoringPlotManagement'
import { newPlotDetails } from 'src/utils/helpers/monitoringPlotHelper/monitoringRealmHelper'
import { useToast } from 'react-native-toast-notifications'
import i18next from 'src/locales/index'

const CreatePlotView = () => {
    const [plotType, setPlotType] = useState<string>('INTERVENTION');
    const [plotShape, setPlotShape] = useState<string>('CIRCULAR');
    const [plotComplexity, setPlotComplexity] = useState<string>('STANDARD');

    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const { initializeNewPlot } = useMonitoringPlotManagement()
    const toast = useToast()

    const handleNav = async () => {
        const details = newPlotDetails(plotShape === 'CIRCULAR' ? 'CIRCULAR' : 'RECTANGULAR', plotType === 'INTERVENTION' ? 'INTERVENTION' : 'CONTROL', plotComplexity === 'SIMPLE' ? 'SIMPLE' : 'STANDARD')
        const result = await initializeNewPlot(details)
        if (result) {
            navigation.replace('CreatePlotDetail', { id: details.plot_id })
        } else {
            toast.show("Error while creating plots")
        }
    }

    const openInfo = () => {
        navigation.navigate('MonitoringInfo')
    }

    return (
        <SafeAreaView style={styles.container}>
            <Header label={i18next.t('label.create_plot_header')} rightComponent={<Pressable onPress={openInfo} style={styles.infoWrapper}><InfoIcon style={styles.infoWrapper} onPress={openInfo} /></Pressable>} />
            <View style={styles.wrapper}>
                <CreatePlotCard header={'Plot Complexity'} labelOne={{
                    key: 'STANDARD',
                    value: i18next.t('label.standard')
                }} labelTwo={{
                    key: 'SIMPLE',
                    value: i18next.t('label.simple')
                }} disabled={true}
                    selectedValue={plotComplexity}
                    onSelect={setPlotComplexity}
                />
                <CreatePlotCard header={i18next.t('label.plot_shape')} labelOne={{
                    key: 'RECTANGULAR',
                    value: i18next.t('label.rectangular')
                }} labelTwo={{
                    key: 'CIRCULAR',
                    value: i18next.t('label.circular')
                }} disabled={false}
                    selectedValue={plotShape}
                    onSelect={setPlotShape} />
                <CreatePlotCard header={i18next.t('label.plot_type')} labelOne={{
                    key: 'INTERVENTION',
                    value: i18next.t('label.intervention')
                }} labelTwo={{
                    key: 'CONTROL',
                    value: i18next.t('label.control')
                }} disabled={false}
                    selectedValue={plotType}
                    onSelect={setPlotType} />
            </View>
            <CustomButton
                label={i18next.t('label.continue')}
                containerStyle={styles.btnContainer}
                pressHandler={handleNav}
                hideFadeIn
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
        bottom: 30,
    },
    infoWrapper: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: '5%'
    }
})
