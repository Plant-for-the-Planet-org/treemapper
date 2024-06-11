import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import SoilMoistureIcon from 'assets/images/svg/SoilMoistureIcon.svg'
// import CanopyCoverIcon from 'assets/images/svg/CanopyCoverIcon.svg'
// import BioacusticsIcon from 'assets/images/svg/BioacusticsIcon.svg'


import { Colors, Typography } from 'src/utils/constants'
import DividerDot from '../common/DividerDot'
interface Props {
    item: any
}

const EcosystemCard = (props: Props) => {
    const { item } = props;
    console.log(item)
    return (
        <View style={styles.container}>
            <View style={styles.wrapper}>
                <View style={styles.avatar}>
                    <SoilMoistureIcon />
                </View>
                <View style={styles.sectionWrapper}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.idLabel}>Soil Moisture</Text>
                    </View>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.planetedLabel}>12d ago</Text>
                        <DividerDot width={20} height={20} size={20} color={Colors.DARK_TEXT_COLOR} />
                        <Text style={styles.planetedLabel}>65%</Text>
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
        justifyContent: 'center'
    },
    wrapper: {
        width: '95%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: Colors.WHITE,
        marginVertical: 5,
        borderRadius: 10
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
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.DARK_TEXT_COLOR
    },
    planetedLabel: {
        fontSize: 14,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_COLOR
    },
    speciesLabel: {
        fontSize: 16,
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