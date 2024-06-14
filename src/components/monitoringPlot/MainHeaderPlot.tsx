import { StyleSheet, View, Text } from 'react-native'
import React from 'react'
import { Colors, Typography } from 'src/utils/constants'
import CardIdIcon from 'assets/images/svg/CardIdIcon.svg'
import TallyIcon from 'assets/images/svg/TallyIcon.svg'
import CircularPlotIcon from 'assets/images/svg/CircularPlotIcon.svg'
import { PLOT_SHAPE } from 'src/types/type/app.type'
import RectangularIcon from 'assets/images/svg/RectangualrIcon.svg'


interface Props {
    shape: PLOT_SHAPE
    width: number
    length: number
    radius: number
    plotID: string
}

const MainHeaderPlot = (props: Props) => {
    const { shape, width, length, radius, plotID } = props
    const metaData = () => {
        if (shape === 'CIRCULAR') {
            return `${radius}m`
        }
        return `${width}m by ${length}m`
    }
    return (
        <View style={styles.container}>
            <View style={styles.wrapper}>
                <View style={styles.cardWrapper}>
                    <View style={styles.cradMetaIcon}>
                        <CardIdIcon />
                        <Text style={styles.cardLabel}>ID</Text>
                    </View>
                    <Text style={styles.cardNote}>
                        {plotID}
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
                        {shape === 'CIRCULAR' ? <CircularPlotIcon /> : <RectangularIcon />}
                    </View>
                    <Text style={styles.cardNote}>
                        {metaData()}
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