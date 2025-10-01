import { Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import PlantedIcon from 'assets/images/svg/PlantedIcon.svg'
import DeceasedTreeIcon from 'assets/images/svg/DeceasedTreeIcon.svg'
import RemeasurementIcon from 'assets/images/svg/RemeasurementIcon.svg'
import { useObject } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { History, SampleTree } from 'src/types/interface/slice.interface'
import { displayYearDate } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import { v4 as uuid } from 'uuid'
import Editicon from 'assets/images/svg/EditPenIcon.svg'

interface Props {
    plantID: string
}

const PlantHistory = (props: Props) => {
    const { plantID } = props;
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
        navigation.replace('TreeRemeasurement', {
            interventionId: plantDetails.intervention_id,
            treeId: plantID,
            isEdit: true,
            historyId: historyId,
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
                    return `Measurement : ${item.height} m high,${item.diameter} cm wide`
                case 'status':
                    return 'Marked deceased.'
                default:
                    return `Tree Planted : ${item.height} m high,${item.diameter} cm wide`
            }
        }

        return (
            <Pressable
                key={index + item.history_id}
                style={styles.cardContainer} onPress={() => { handleSelection(item.history_id, item.dataStatus) }}>
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
                        {item.dataStatus !== 'SYNCED' && <Editicon style={{marginRight:'5%'}}/>}
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



    return (
        <View style={styles.container}>
            <View style={styles.wrapper}>
                <View style={styles.sectionWrapper}>
                    {selectedTimeline.map((el, i) => {
                        return renderCard(el, i)
                    })}
                </View>
            </View>
        </View>
    )
}

export default PlantHistory

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 20
    },
    wrapper: {
        width: '100%',
        alignItems: 'center',
    },
    btnContainer: {
        width: '100%',
        height: 70,
        position: 'absolute',
        bottom: 30,
    },
    sectionWrapper: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        paddingTop: 10
    },
    footerWrapper: {
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