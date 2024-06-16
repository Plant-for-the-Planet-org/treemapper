import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import SoilMoistureIcon from 'assets/images/svg/SoilMoistureIcon.svg'
import CanopyCoverIcon from 'assets/images/svg/CanopyCoverIcon.svg'
import BioacusticsIcon from 'assets/images/svg/BioacusticsIcon.svg'


import { Colors, Typography } from 'src/utils/constants'
import DividerDot from '../common/DividerDot'
import { PlotObservation } from 'src/types/interface/slice.interface'
import { formatRelativeTimeCustom } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
interface Props {
    item: PlotObservation | any
}

const EcosystemCard = (props: Props) => {
    const { type, value, unit, obs_date } = props.item;
    const renderIcon = () => {
        switch (type) {
            case 'SOIL_MOISTURE':
                return <SoilMoistureIcon />
            case 'BIOACUSTICS':
                return <BioacusticsIcon />
            case 'CANOPY':
                return <CanopyCoverIcon />
            default:
                return <CanopyCoverIcon />
        }
    }

    const render = () => {
        let l = ''
        if (type === 'SOIL_MOISTURE') l = "Soil Moisture"
        if (type === 'CANOPY') l = "Canopy"
        if (type === 'BIOACUSTICS') l = "Bioacustics"
        return l
    }

    return (
        <View style={styles.container}>
            <View style={styles.wrapper}>
                <View style={styles.avatar}>
                    {renderIcon()}
                </View>
                <View style={styles.sectionWrapper}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.idLabel}>{render()}</Text>
                    </View>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.planetedLabel}>{formatRelativeTimeCustom(obs_date)}</Text>
                        <DividerDot width={18} height={18} size={18} color={Colors.TEXT_LIGHT} />
                        <Text style={styles.planetedLabel}>{value}{unit}</Text>
                    </View>
                </View>
            </View>
        </View>
    )
}

export default EcosystemCard


const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    wrapper: {
        width: '90%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        backgroundColor: Colors.WHITE,
        marginVertical: 5,
        borderRadius: 10,

    },
    sectionWrapper: {
        flex: 1,
        marginLeft: 20
    },
    sectionHeader: {
        width: '100%',
        alignItems: 'center',
        flexDirection: 'row'
    },
    avatar: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.NEW_PRIMARY + '1A',
        borderRadius: 8,
        marginLeft: 10
    },
    idLabel: {
        fontSize: 14,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.DARK_TEXT_COLOR
    },
    dateLabel: {
        fontSize: 14,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.DARK_TEXT_COLOR
    },
    planetedLabel: {
        fontSize: 12,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_LIGHT
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