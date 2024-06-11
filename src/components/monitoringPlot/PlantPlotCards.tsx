import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import SingleTreeIcon from 'assets/images/svg/RoundTreeIcon.svg'
// import DeceasedTreeIcon from 'assets/images/svg/DeceasedTreeIcon.svg'
import Addicon from 'assets/images/svg/Addicon.svg'

import { Colors, Typography } from 'src/utils/constants'
import DividerDot from '../common/DividerDot'
interface Props {
    item: any
    handleSelection: () => void
}

const PlantPlotCards = (props: Props) => {
    const { handleSelection } = props;
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.wrapper} onPress={handleSelection}>
                <View style={styles.avatar}>
                    <SingleTreeIcon />
                </View>
                <View style={styles.sectionWrapper}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.idLabel}>EE-101</Text>
                        <DividerDot width={20} height={20} size={20} color={Colors.DARK_TEXT_COLOR} />
                        <Text style={styles.dateLabel}>10d ago</Text>
                    </View>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.planetedLabel}>Planted</Text>
                        <DividerDot width={20} height={20} size={20} color={Colors.DARK_TEXT_COLOR} />
                        <Text style={styles.speciesLabel}>Catalpa bungei</Text>
                    </View>
                </View>
                <View style={styles.addIconWrapper}>
                    <Addicon />
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
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.DARK_TEXT_COLOR
    },
    planetedLabel: {
        fontSize: 16,
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