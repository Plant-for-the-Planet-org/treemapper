import { StyleSheet, View, Text } from 'react-native'
import React from 'react'
import { Colors, Typography } from 'src/utils/constants'
import CardIdIcon from 'assets/images/svg/CardIdIcon.svg'
import TallyIcon from 'assets/images/svg/TallyIcon.svg'
import CircularPlotIcon from 'assets/images/svg/CircularPlotIcon.svg'

const MainHeaderPlot = () => {
    return (
        <View style={styles.container}>
            <View style={styles.wrapper}>
                <View style={styles.cardWrapper}>
                    <View style={styles.cradMetaIcon}>
                        <CardIdIcon />
                        <Text style={styles.cardLabel}>ID</Text>
                    </View>
                    <Text style={styles.cardNote}>
                        ZK12D4DD
                    </Text>
                </View>
                <View style={styles.cardWrapper}>
                    <View style={styles.cradMetaIcon}>
                        <TallyIcon />
                    </View>
                    <Text style={styles.cardNote}>
                        512 Obs
                    </Text>
                </View>
                <View style={styles.cardWrapper}>
                    <View style={styles.cradMetaIcon}>
                        <CircularPlotIcon />
                    </View>
                    <Text style={styles.cardNote}>
                        7.14m
                    </Text>
                </View>
            </View>
        </View>
    )
}

export default MainHeaderPlot

const styles = StyleSheet.create({
    container: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.NEW_PRIMARY + '1A'
    },
    wrapper: {
        width: '90%',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        paddingVertical: 20
    },
    cardWrapper: {
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        marginHorizontal: '2%',
        width: 100,
    },
    cradMetaIcon: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row'
    },
    cardLabel: {
        fontSize: 12,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR,
        marginHorizontal: 5
    },
    cardNote: {
        fontSize: 10,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR,
        marginTop: 5
    }
})