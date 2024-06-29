import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import SingleTreeIcon from 'assets/images/svg/RoundTreeIcon.svg'
import RecruitTreeIcon from 'assets/images/svg/RecruitTreeIcon.svg'

// import DeceasedTreeIcon from 'assets/images/svg/DeceasedTreeIcon.svg'
import Addicon from 'assets/images/svg/Addicon.svg'

import { Colors, Typography } from 'src/utils/constants'
import DividerDot from '../common/DividerDot'
import { PlantedPlotSpecies } from 'src/types/interface/slice.interface'
import { formatRelativeTimeCustom } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
interface Props {
    item: PlantedPlotSpecies
    handleSelection: (plantID: string) => void,
    index: number
}

const PlantPlotCards = (props: Props) => {
    const { handleSelection, item } = props;
    const handlePlantSelction = () => {
        handleSelection(item.plot_plant_id)
    }
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.wrapper} onPress={handlePlantSelction}>
                <View style={styles.avatar}>
                    {item.type === 'PLANTED' ? <SingleTreeIcon /> : <RecruitTreeIcon />}
                </View>
                <View style={styles.sectionWrapper}>
                    <View style={styles.sectionHeader}>
                        {item.tag.length > 0 && <><Text style={styles.idLabel}>{item.tag}</Text>
                            <DividerDot width={20} height={20} size={20} color={Colors.DARK_TEXT_COLOR} /></>}
                        <Text style={styles.dateLabel}>{formatRelativeTimeCustom(item.details_updated_at)}</Text>
                    </View>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.planetedLabel}>{item.type === 'PLANTED' ? "Planted" : "Recruit"}</Text>
                        <DividerDot width={20} height={20} size={20} color={Colors.DARK_TEXT_COLOR} />
                        <Text style={styles.speciesLabel}>{item.scientificName}</Text>
                    </View>
                </View>
                <View style={[styles.addIconWrapper, { backgroundColor: item.type === 'PLANTED' ? Colors.NEW_PRIMARY : Colors.RECRUIT_PLANT_THEME }]}>
                    <Addicon fill={Colors.WHITE} />
                </View>
            </TouchableOpacity>
        </View>
    )
}

export default PlantPlotCards

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center', paddingVertical: 10
    },
    wrapper: {
        width: '90%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: Colors.WHITE,
        marginVertical: 5,
        borderRadius: 10
    },
    sectionWrapper: {
        flex: 1,
        marginLeft: 10
    },
    sectionHeader: {
        width: '100%',
        alignItems: 'center',
        flexDirection: 'row'
    },
    avatar: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.NEW_PRIMARY + '1A',
        borderRadius: 8,
        marginLeft: 10
    },
    idLabel: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.DARK_TEXT_COLOR
    },
    dateLabel: {
        fontSize: 14,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.DARK_TEXT_COLOR
    },
    planetedLabel: {
        fontSize: 14,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_COLOR
    },
    speciesLabel: {
        fontSize: 14,
        fontFamily: Typography.FONT_FAMILY_ITALIC,
        color: Colors.TEXT_COLOR
    },
    addIconWrapper: {
        width: 25,
        height: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.NEW_PRIMARY,
        borderRadius: 8,
        marginRight: 10
    }
})