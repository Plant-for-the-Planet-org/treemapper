import { StyleSheet } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import PlotDetailsHeader from 'src/components/monitoringPlot/PlotDetailsHeader'
import { Colors } from 'src/utils/constants'
import MainHeaderPlot from 'src/components/monitoringPlot/MainHeaderPlot'
import PlotDetailsTab from 'src/components/monitoringPlot/PlotDetailsTab'
import PlotPlantSearch from 'src/components/monitoringPlot/PlotPlantSearch'
import PlotPlantList from 'src/components/monitoringPlot/PlotPlantList'
import EcosystemList from 'src/components/monitoringPlot/EcosystemtList'
import PlotMapDisplay from 'src/components/monitoringPlot/PlotMapDisplay'

const PlotDetailsView = () => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    return (
        <SafeAreaView style={styles.container}>
            <PlotDetailsHeader />
            <MainHeaderPlot />
            <PlotDetailsTab changeIndex={setSelectedIndex} selectedIndex={selectedIndex} />
            {selectedIndex === 0 && <>
                <PlotPlantSearch />
                <PlotPlantList /></>}
            {selectedIndex === 1 && <EcosystemList />}
            {selectedIndex === 2 && <PlotMapDisplay />}
        </SafeAreaView>
    )
}

export default PlotDetailsView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    },

})