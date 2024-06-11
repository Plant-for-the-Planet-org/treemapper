import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import BackIcon from 'assets/images/svg/BackIcon.svg'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { Colors, Typography } from 'src/utils/constants'


const PlotPlantRemeasureHeader = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const goBack = () => {
        navigation.goBack()
    }
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backIcon} onPress={goBack}><BackIcon onPress={goBack} /></TouchableOpacity>
            <View style={styles.sectionWrapper}>
                <Text style={styles.headerLabel}>
                    Remeasure <Text style={styles.highlight}>EE-101</Text>
                </Text>
                <Text style={styles.noteLabel}>
                    Catzin negri
                </Text>
            </View>
        </View>
    )
}

export default PlotPlantRemeasureHeader

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    sectionWrapper: {
        marginLeft: 20,
        flex: 1
    },
    backIcon: {
        width: 20,
        height: 20,
        marginLeft: 20,
    },
    headerLabel: {
        fontFamily: Typography.FONT_FAMILY_BOLD,
        color: Colors.DARK_TEXT_COLOR,
        fontSize: 20
    },
    highlight: {
        color: Colors.NEW_PRIMARY
    },
    noteLabel: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_COLOR,
        fontSize: 14
    },
    rightContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center'
    }
})