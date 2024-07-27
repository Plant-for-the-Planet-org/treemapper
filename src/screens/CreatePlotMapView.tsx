import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import Header from 'src/components/common/Header'
import GpsAccuracyTile from 'src/components/map/GpsAccuracyTile'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'
import { SafeAreaView } from 'react-native-safe-area-context'
import CreatePlotMapDetail from 'src/components/map/CreatePlotMapDetail'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useToast } from 'react-native-toast-notifications'
import { RealmSchema } from 'src/types/enum/db.enum'
import { MonitoringPlot, PlantedPlotSpecies } from 'src/types/interface/slice.interface'
import { useRealm } from '@realm/react'
import { PLOT_SHAPE } from 'src/types/type/app.type'
import UserlocationMarker from 'src/components/map/UserlocationMarker'
import NewDimensionModal from 'src/components/monitoringPlot/NewDimensionModal'
import i18next from 'src/locales/index'


const CreatePlotMapView = () => {

    const realm = useRealm()
    const [plotShape, setPlotShape] = useState<PLOT_SHAPE>('CIRCULAR');
    const [plotLength, setPlotLength] = useState(0);
    const [plotWidth, setPlotWidth] = useState(0);
    const [plotRadius, setPlotRadius] = useState(0);
    const [plotName, setPlotName] = useState('');
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const route = useRoute<RouteProp<RootStackParamList, 'CreatePlotMap'>>()
    const plotID = route.params?.id ?? '';
    const isEdit = route.params?.isEdit ?? false;
    const markLocation = route.params && route.params.markLocation ? route.params.markLocation : false
    const plantId = route.params?.plantId ?? '';
    const [initialPolygon, setInitialPloygon] = useState<any>([])
    const [plantedTrees, setPlantedTrees] = useState<PlantedPlotSpecies[]>([])
    const toast = useToast()
    const [showDimensionModal, setShowDimensionModal] = useState(false)

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
            setPlotName(plotData.name)
            setPlantedTrees(plotData.plot_plants)
            if (markLocation || isEdit) {
                setInitialPloygon(JSON.parse(plotData.location.coordinates))
            }
            if (isEdit) {
                setShowDimensionModal(true)
            }
        } else {
            toast.show("No plot details found")
            navigation.goBack()
        }
    }

    const handleUpdateDimension = (h: number, w: number, r: number) => {
        setPlotLength(h)
        setPlotWidth(w)
        setPlotRadius(r)
        setShowDimensionModal(false)
    }


    return (
        <SafeAreaView style={styles.container}>
            <Header label={i18next.t('label.center')} rightComponent={<GpsAccuracyTile showModalInfo={() => null} />} />
            <View style={styles.noteWrapper}>
                <Text style={styles.noteLabel}>{i18next.t('label.plot_map_note_1')} {plotName} {i18next.t('label.plot_map_note_2')}.</Text>
            </View>
            {isEdit && <NewDimensionModal
                isVisible={showDimensionModal} toogleModal={() => {
                    setShowDimensionModal(!showDimensionModal)
                }} updatedDimensions={handleUpdateDimension} initalValue={{
                    h: String(plotLength),
                    w: String(plotWidth),
                    r: String(plotRadius),
                }} shape={plotShape} />}
            <CreatePlotMapDetail
                initialPolygon={initialPolygon}
                isMarking={markLocation}
                showNewDimensionModal={() => { setShowDimensionModal(true) }}
                plantId={plantId}
                isEdit={isEdit}
                plantedTrees={plantedTrees}
                plot_shape={plotShape} radius={plotRadius} length={plotLength} width={plotWidth} plotId={plotID} />
            <UserlocationMarker />
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
})