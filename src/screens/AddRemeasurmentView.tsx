import { FlatList, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import PlotPlantRemeasureHeader from 'src/components/monitoringPlot/PlotPlantRemeasureHeader'
import { Colors, Typography } from 'src/utils/constants'
import { BACKDROP_COLOR } from 'src/utils/constants/colors'
import CustomButton from 'src/components/common/CustomButton'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'

import PlantedIcon from 'assets/images/svg/PlantedIcon.svg'
import DeceasedTreeIcon from 'assets/images/svg/DeceasedTreeIcon.svg'
import RemeasurmentIcon from 'assets/images/svg/RemeasurmentIcon.svg'
import { useObject } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { MonitoringPlot, PlantTimeLine, PlantedPlotSpecies } from 'src/types/interface/slice.interface'
import { displayYearDate } from 'src/utils/helpers/appHelper/dataAndTimeHelper'




const AddRemeasurmentView = () => {
    const route = useRoute<RouteProp<RootStackParamList, 'PlotPlantRemeasure'>>()
    const plotID = route.params && route.params.id ? route.params.id : ''
    const plantID = route.params && route.params.plantID ? route.params.plantID : ''
    const [selectedTimeline, setSelectedTimeLIne] = useState<PlantedPlotSpecies>()

    const plotDetails = useObject<MonitoringPlot>(
        RealmSchema.MonitoringPlot, plotID
    )

    useEffect(() => {
        if (plantID) {
            const getPlantDetails = plotDetails.plot_plants.find(el => el.plot_plant_id === plantID)
            if (getPlantDetails) {
                setSelectedTimeLIne(getPlantDetails)
            }
        }
    }, [plotID])



    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const handleSelection = () => {
        navigation.navigate('PlotPlantRemeasure', { id: plotID, plantID: plantID })
    }
    const renderCard = (item: PlantTimeLine, index: number) => {
        const renderIcon = () => {
            switch (item.status) {
                case 'REMEASURMENT':
                    return <RemeasurmentIcon />
                case 'DESCEASED':
                    return <DeceasedTreeIcon />
                default:
                    return <PlantedIcon />
            }
        }
        const label = () => {
            switch (item.status) {
                case 'REMEASURMENT':
                    return `Measurement ${index}: ${item.length}${item.length_unit} high,${item.width}${item.width_unit} wide`
                case 'DESCEASED':
                    return 'Marked deceased'
                default:
                    return 'Tree Planted'
            }
        }
        return (
            <View style={styles.cardContainer}>
                <View style={styles.iconWrapper}>
                    <View style={[styles.icon, { backgroundColor: item.status === 'DESCEASED' ? Colors.GRAY_BACKDROP : Colors.NEW_PRIMARY + '1A' }]}>
                        {renderIcon()}
                    </View>
                    {item.status !== 'DESCEASED' && <View style={styles.divider} />}
                </View>
                <View style={styles.cardSection}>
                    <Text style={styles.cardHeader}>
                        {displayYearDate(item.date)}
                    </Text>
                    <Text style={styles.cardLabel}>
                        {label()}
                    </Text>
                </View>
            </View>
        )
    }
    if (!selectedTimeline) {
        return null
    }
    return (
        <SafeAreaView style={styles.cotnainer}>
            <PlotPlantRemeasureHeader label={selectedTimeline.plot_plant_id} type={selectedTimeline.type} species={selectedTimeline.scientific_name} allias={selectedTimeline.aliases} showRemeasure={false} />
            <View style={styles.wrapper}>
                <View style={styles.sectionWrapper}>
                    <FlatList
                        showsVerticalScrollIndicator={false}
                        style={styles.flatlistWrapper}
                        ListFooterComponent={() => (<View style={styles.footerWrapper} />)}
                        renderItem={({ item, index }) => { return renderCard(item, index) }}
                        data={selectedTimeline ? selectedTimeline.timeline : []} />
                </View>
            </View>
            {selectedTimeline.is_alive && <CustomButton
                label="Add Remeasurment"
                containerStyle={styles.btnContainer}
                pressHandler={handleSelection}
                hideFadein
            />}
        </SafeAreaView>
    )
}

export default AddRemeasurmentView

const styles = StyleSheet.create({
    cotnainer: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: Colors.WHITE
    },
    wrapper: {
        backgroundColor: BACKDROP_COLOR,
        width: '100%',
        alignItems: 'center',
        flex: 1
    },
    btnContainer: {
        width: '100%',
        height: 70,
        position: 'absolute',
        bottom: 50,
    },
    imageWrapper: {
        backgroundColor: Colors.SAPPHIRE_BLUE,
        borderRadius: 20,
        marginBottom: 20,
        width: '100%',
        height: 240,
        marginTop: 20
    },
    sectionWrapper: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        paddingTop: 50
    },
    footerWrapper: {
        height: 100,
        width: '100%'
    },
    flatlistWrapper: {
        width: '90%',
    },
    cardContainer: {
        width: '90%',
        height: 90,
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },
    icon: {
        width: 40, height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.NEW_PRIMARY + '1A',
        borderRadius: 10
    },
    iconWrapper: {
        width: 50,
        height: '100%',
        alignItems: 'center'
    },
    cardSection: {
        flex: 1,
        marginLeft: 10,
        height: '100%',
        justifyContent: 'flex-start'
    },
    divider: {
        flex: 1,
        width: 2,
        backgroundColor: Colors.TEXT_LIGHT
    },
    cardHeader: {
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.DARK_TEXT_COLOR,
        fontSize: 18,
    },
    cardLabel: {
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_LIGHT,
        fontSize: 14,
        letterSpacing: 0.2
    }
})