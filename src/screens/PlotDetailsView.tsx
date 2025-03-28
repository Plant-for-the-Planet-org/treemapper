import { StyleSheet, View } from 'react-native'
import React, { useState } from 'react'
import PlotDetailsHeader from 'src/components/monitoringPlot/PlotDetailsHeader'
import { Colors } from 'src/utils/constants'
import MainHeaderPlot from 'src/components/monitoringPlot/MainHeaderPlot'
import PlotDetailsTab from 'src/components/monitoringPlot/PlotDetailsTab'
import PlotPlantList from 'src/components/monitoringPlot/PlotPlantList'
import EcosystemList from 'src/components/monitoringPlot/EcosystemList'
import PlotMapDisplay from 'src/components/monitoringPlot/PlotMapDisplay'
import EidPlantModal from 'src/components/monitoringPlot/EidPlantModal'
import { useObject } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { MonitoringPlot } from 'src/types/interface/slice.interface'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { RouteProp, useRoute } from '@react-navigation/native'

const PlotDetailsView = () => {
    const route = useRoute<RouteProp<RootStackParamList, 'CreatePlotDetail'>>()
    const plotID = route.params?.id ?? '';
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [showEdit, setShowEdit] = useState(false)

    const monitoringPlot = useObject<MonitoringPlot>(
        RealmSchema.MonitoringPlot, plotID
    )
    const { shape, name, length, width, radius, complexity, plot_plants, observations, plot_group } = monitoringPlot;
    return (
        <View style={styles.container}>
            <PlotDetailsHeader showOptions={() => { setShowEdit(true) }} label={name} type={complexity} group={plot_group && plot_group.length > 0 ? plot_group[0].name : ''} />
            <MainHeaderPlot shape={shape} width={width} length={length} radius={radius} plotID={plotID} obsCount={observations.length} />
            <PlotDetailsTab changeIndex={setSelectedIndex} selectedIndex={selectedIndex} />
            <View style={styles.mainSection}>
                {selectedIndex === 0 &&
                    <PlotPlantList plants={plot_plants} plotID={plotID} />}
                {selectedIndex === 1 && <EcosystemList plotID={plotID} data={monitoringPlot} />}
                {selectedIndex === 2 && <PlotMapDisplay data={monitoringPlot} />}
            </View>
            <EidPlantModal
                isVisible={showEdit}
                toogleModal={() => { setShowEdit(false) }}
                plotId={plotID}
                plotData={monitoringPlot}
            />
        </View>
    )
}

export default PlotDetailsView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE,
        paddingTop:40
    },
    mainSection: {
        flex: 1,
        backgroundColor: Colors.BACKDROP_COLOR,
    },
})