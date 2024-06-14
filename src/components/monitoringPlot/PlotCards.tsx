import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
// import DeceasedTreeIcon from 'assets/images/svg/DeceasedTreeIcon.svg'

import { Colors, Typography } from 'src/utils/constants'
import DividerDot from '../common/DividerDot'
import { MonitoringPlot } from 'src/types/interface/slice.interface'
import { formatRelativeTimeCustom } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
interface Props {
    item: MonitoringPlot | any
    handleSelection: (id:string) => void
}

const PlotCards = (props: Props) => {
    const { handleSelection, item } = props;
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.wrapper} onPress={()=>{handleSelection(item.plot_id)}}>
                {/* <Image source={item.image} style={styles.avatar}/> */}
                <View style={styles.avatar} />
                <View style={styles.sectionWrapper}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.idLabel}>{item.name}</Text>
                    </View>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.planetedLabel}>{item.length}</Text>
                        <DividerDot width={20} height={20} size={20} color={Colors.DARK_TEXT_COLOR} />
                        {/* <Text style={styles.planetedLabel}>{item.}</Text> */}
                    </View>
                    <Text style={styles.speciesLabel}>{formatRelativeTimeCustom(item.plot_created_at)}</Text>
                </View>
                {item.plot_groups.length > 0 && <View style={styles.plotDetailsWrapper}>
                    <Text style={styles.plotTitle}>Las Americas 7 Vertisols</Text>
                </View>}
            </TouchableOpacity>
        </View>
    )
}

export default PlotCards

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 5
    },
    wrapper: {
        width: '90%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: Colors.WHITE,
        marginVertical: 5,
        borderRadius: 12,
        shadowColor: Colors.GRAY_TEXT,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 2,
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
        width: 70,
        height: 70,
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
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.DARK_TEXT_COLOR
    },
    planetedLabel: {
        fontSize: 12,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.DARK_TEXT
    },
    speciesLabel: {
        fontSize: 10,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_LIGHT
    },
    plotDetailsWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.GRAY_BACKDROP,
        position: 'absolute',
        right: 0,
        top: 0,
        borderBottomLeftRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderTopRightRadius: 12
    },
    plotTitle: {
        fontSize: 10,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.DARK_TEXT
    }
})