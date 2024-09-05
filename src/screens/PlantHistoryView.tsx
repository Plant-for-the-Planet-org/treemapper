import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import PlotPlantRemeasureHeader from 'src/components/monitoringPlot/PlotPlantRemeasureHeader'
import { Colors, Typography } from 'src/utils/constants'
import { BACKDROP_COLOR } from 'src/utils/constants/colors'
import CustomButton from 'src/components/common/CustomButton'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import UnSyncIcon from 'assets/images/svg/UnSyncIcon.svg';
import PlantedIcon from 'assets/images/svg/PlantedIcon.svg'
import DeceasedTreeIcon from 'assets/images/svg/DeceasedTreeIcon.svg'
import RemeasurementIcon from 'assets/images/svg/RemeasurementIcon.svg'
import { useObject } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { History, SampleTree } from 'src/types/interface/slice.interface'
import { displayYearDate } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import { v4 as uuid } from 'uuid'
import Editicon from 'assets/images/svg/EditPenIcon.svg'


const PlantHistory = () => {
    const route = useRoute<RouteProp<RootStackParamList, 'PlantHistory'>>()
    const plantID = route.params?.id ?? '';
    const [selectedTimeline, setSelectedTimeline] = useState<History[]>([]);

    const plantDetails = useObject<SampleTree>(
        RealmSchema.TreeDetail, plantID
    )
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

    useEffect(() => {
        const initialData: History = {
            history_id: uuid(),
            eventName: 'created',
            eventDate: plantDetails.plantation_date,
            imageUrl: plantDetails.image_url,
            cdnImageUrl: plantDetails.cdn_image_url,
            diameter: plantDetails.specie_diameter,
            height: plantDetails.specie_height,
            additionalDetails: [],
            appMetadata: '',
            status: '',
            statusReason: '',
            dataStatus: 'SYNCED',
            parentId: plantDetails.tree_id,
            samplePlantLocationIndex: 0,
            lastScreen: ''
        }
        const finalData = [initialData, ...plantDetails?.history ? plantDetails.history : []]
        setSelectedTimeline([...finalData])
    }, [plantDetails])




    const handleSelection = (historyId: string, status: string) => {
        if (status === "SYNCED") {
            return
        }
        navigation.navigate('TreeRemeasurement', {
            interventionId: plantDetails.intervention_id,
            treeId: plantID,
            isEdit: true,
            historyId: historyId,
        }
        )
    }
    const addNewRemeasurement = () => {
        navigation.navigate('TreeRemeasurement', {
            interventionId: plantDetails.intervention_id,
            treeId: plantID
        }
        )
    }




    const renderCard = (item: History, index: number) => {
        const renderIcon = () => {
            switch (item.eventName) {
                case 'measurement':
                    return <RemeasurementIcon />
                case 'status':
                    return <DeceasedTreeIcon />
                default:
                    return <PlantedIcon />
            }
        }

        const label = () => {
            switch (item.eventName) {
                case 'measurement':
                    return `Measurement ${index}: ${item.height} m high,${item.diameter} cm wide`
                case 'status':
                    return 'Marked status'
                default:
                    return `Tree Planted : ${index}: ${item.height} m high,${item.diameter} cm wide`
            }
        }

        return (
            <Pressable style={styles.cardContainer} onPress={() => { handleSelection(item.history_id, item.dataStatus) }}>
                <View style={styles.iconWrapper}>
                    <View style={[styles.icon, { backgroundColor: item.eventName === 'status' ? Colors.GRAY_BACKDROP : Colors.NEW_PRIMARY + '1A' }]}>
                        {renderIcon()}
                    </View>
                    {item.eventName !== 'status' && <View style={styles.divider} />}
                </View>
                <View style={styles.cardSection}>
                    <View style={styles.sectionHeaderWrapper}>
                        <Text style={styles.cardHeader}>
                            {displayYearDate(item.eventDate)}
                        </Text>
                        {item.dataStatus !== 'SYNCED' && <Editicon />}
                    </View>
                    <Text style={styles.cardLabel}>
                        {label()}
                    </Text>
                </View>
            </Pressable>
        )
    }
    if (!selectedTimeline) {
        return null
    }

    const moveToHome = () => {
        navigation.popToTop()
        //@ts-expect-error Extra params
        navigation.navigate('Home', {
            screen: 'Map'
        });
    }

    const rightContainer = () => {
        if (plantDetails.status === 'SYNCED') {
            return null
        }
        return <UnSyncIcon style={{ marginRight: '5%', marginTop: -10 }} height={30} width={30} onPress={moveToHome} />
    }

    const renderFooter = () => (<View style={styles.footerWrapper} />)

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <PlotPlantRemeasureHeader tree label={plantDetails.hid} type={'RECRUIT'} species={plantDetails.specie_name} showRemeasure={true} rightComponent={rightContainer()} />
            <View style={styles.wrapper}>
                <View style={styles.sectionWrapper}>
                    <FlatList
                        showsVerticalScrollIndicator={false}
                        style={styles.flatListWrapper}
                        ListFooterComponent={renderFooter}
                        renderItem={({ item, index }) => { return renderCard(item, index) }}
                        data={selectedTimeline} />
                </View>
            </View>
            {plantDetails.is_alive && plantDetails.status === 'SYNCED' ? <CustomButton
                label="Add New Measurement"
                containerStyle={styles.btnContainer}
                pressHandler={addNewRemeasurement}
            /> : null}
        </SafeAreaView>
    )
}

export default PlantHistory

const styles = StyleSheet.create({
    container: {
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
        bottom: 30,
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
    flatListWrapper: {
        width: '90%',
    },
    cardContainer: {
        width: '95%',
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
    sectionHeaderWrapper: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between'
    },
    rightComp: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 30,
        height: 30,
        marginRight: 10
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