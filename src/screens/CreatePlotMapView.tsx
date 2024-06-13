import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import Header from 'src/components/common/Header'
import GpsAccuracyTile from 'src/components/map/GpsAccuracyTile'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import CustomButton from 'src/components/common/CustomButton'
import { SafeAreaView } from 'react-native-safe-area-context'
import CreatePlotMapDetail from 'src/components/map/CreatePlotMapDetail'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useToast } from 'react-native-toast-notifications'
import { RealmSchema } from 'src/types/enum/db.enum'
import { MonitoringPlot } from 'src/types/interface/slice.interface'
import { useRealm } from '@realm/react'
import useMonitoringPlotMangement from 'src/hooks/realm/useMonitoringPlotMangement'
import { PLOT_SHAPE } from 'src/types/type/app.type'

const CreatePlotMapView = () => {

    const realm = useRealm()
    const { updatePlotDetails } = useMonitoringPlotMangement()

    const [plotShape, setPlotShape] = useState<PLOT_SHAPE>('CIRCULAR');
    const [plotLength, setPlotLength] = useState(0);
    const [plotWidth, setPlotWidth] = useState(0);
    const [plotRadius, setPlotRadius] = useState(0);
    console.log(plotShape, plotLength, plotWidth, plotRadius, updatePlotDetails)
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const route = useRoute<RouteProp<RootStackParamList, 'CreatePlotDetail'>>()
    const plotID = route.params && route.params.id ? route.params.id : ''
    const toast = useToast()

    useEffect(() => {
        getPlotDetails()
    }, [plotID])



    const getPlotDetails = () => {
        const plotData = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotID);
        if (plotData) {
            setPlotShape(plotData.shape)
            setPlotLength(plotData.length)
            setPlotWidth(plotData.width)
            setPlotRadius(plotData.radius)
        } else {
            toast.show("No plot details found")
            navigation.goBack()
        }
    }


    const handleNav = () => {
        navigation.navigate('PlotDetails')
    }
    return (
        <SafeAreaView style={styles.container}>
            <Header label='Plot Center' rightComponet={<GpsAccuracyTile showModalInfo={() => null} />} />
            <View style={styles.noteWrapper}>
                <Text style={styles.noteLabel}>Go to the center of the plot and insert a painted rebar post labeled Plot Name or another permanent, labeled marking</Text>
            </View>
            <CreatePlotMapDetail />
            <CustomButton
                label="Continue"
                containerStyle={styles.btnContainer}
                pressHandler={handleNav}
            />
        </SafeAreaView>
    )
}

export default CreatePlotMapView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    },
    noteWrapper: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20
    },
    noteLabel: {
        width: '90%',
        fontSize: scaleFont(12),
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_COLOR,
        lineHeight: 20,
        textAlign: 'left'
    },
    btnContainer: {
        width: '100%',
        height: scaleSize(70),
        position: 'absolute',
        bottom: 50,
    },
})