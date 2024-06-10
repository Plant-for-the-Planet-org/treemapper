import { StyleSheet } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import PlotDetailsHeader from 'src/components/monitoringPlot/PlotDetailsHeader'
import { Colors } from 'src/utils/constants'
import MainHeaderPlot from 'src/components/monitoringPlot/MainHeaderPlot'
import PlotDetailsTab from 'src/components/monitoringPlot/PlotDetailsTab'
import PlotPlantSearch from 'src/components/monitoringPlot/PlotPlantSearch'
import PlotPlantList from 'src/components/monitoringPlot/PlotPlantList'

const PlotDetailsView = () => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    return (
        <SafeAreaView style={styles.container}>
            <PlotDetailsHeader />
            <MainHeaderPlot />
            <PlotDetailsTab changeIndex={setSelectedIndex} selectedIndex={selectedIndex} />
            <PlotPlantSearch />
            {selectedIndex === 0 && <PlotPlantList />}
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