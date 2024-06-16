import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import BinIcon from 'assets/images/svg/BinIcon.svg'

import { Colors, Typography } from 'src/utils/constants'
import DividerDot from '../common/DividerDot'
interface Props {
    item: any
    handleSelection: () => void
}

const GroupPlotCards = (props: Props) => {
    const { handleSelection } = props;
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.wrapper} onPress={handleSelection}>
                <View style={styles.sectionWrapper}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.idLabel}>Americas 7 Vertisols</Text>
                    </View>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.planetedLabel}>6 interventin plots</Text>
                        <DividerDot width={20} height={20} size={20} color={Colors.DARK_TEXT_COLOR} />
                        <Text style={styles.planetedLabel}>5 control plots</Text>
                    </View>
                </View>
                <View style={styles.plotDetailsWrapper}>
                    <View style={styles.avatar}>
                        <BinIcon width={18} height={18} fill={Colors.TEXT_LIGHT}/>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    )
}

export default GroupPlotCards

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
        marginLeft: 20
    },
    sectionHeader: {
        width: '100%',
        alignItems: 'center',
        flexDirection: 'row'
    },
    avatar: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.GRAY_BACKDROP,
        borderRadius: 8,
        marginHorizontal: 10
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
        flexDirection: 'row',
        width: '20%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    plotTitle: {
        fontSize: 10,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.DARK_TEXT
    }
})