import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { ReactElement } from 'react'
import BackIcon from 'assets/images/svg/BackIcon.svg'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { Colors, Typography } from 'src/utils/constants'
import { PLOT_PLANT } from 'src/types/type/app.type'
import i18next from 'src/locales/index'

interface Props {
    label: string
    type: PLOT_PLANT
    species: string
    showRemeasure: boolean
    rightComponent?: ReactElement,
    tree?: boolean
}

const PlotPlantRemeasureHeader = ({ label, type, species, showRemeasure, rightComponent, tree }: Props) => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const goBack = () => {
        navigation.goBack()
    }
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backIcon} onPress={goBack}><BackIcon onPress={goBack} /></TouchableOpacity>
            <View style={styles.sectionWrapper}>
                <View style={styles.headerLabelContainer}>
                    {showRemeasure ? <>
                        <Text style={styles.headerLabel}>{tree ? 'Remeasurement  ' : 'Remeasure '}</Text>
                        <Text style={styles.highlight}>{label}</Text>
                    </> : <><Text style={styles.headerLabel}>{label}</Text>
                        <View style={[styles.chip, { backgroundColor: type == 'PLANTED' ? Colors.NEW_PRIMARY + '1A' : Colors.RECRUIT_PLANT_THEME + '1A' }]}><Text style={[styles.chipLabel, { color: type === 'PLANTED' ? Colors.NEW_PRIMARY : Colors.RECRUIT_PLANT_THEME }]}>{type === 'PLANTED' ? `${i18next.t("label.planted")}` : `${i18next.t("label.recruit")}`}</Text></View></>}
                </View>
                <Text style={styles.noteLabel}>
                    {species}
                </Text>
            </View>
            {!!rightComponent && rightComponent}
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
    headerLabelContainer: {
        flexDirection: 'row',
        alignItems: "center"
    },
    headerLabel: {
        fontFamily: Typography.FONT_FAMILY_BOLD,
        color: Colors.DARK_TEXT_COLOR,
        fontSize: 20
    },
    highlight: {
        fontFamily: Typography.FONT_FAMILY_BOLD,
        fontSize: 20,
        color: Colors.NEW_PRIMARY
    },
    noteLabel: {
        fontFamily: Typography.FONT_FAMILY_ITALIC,
        color: Colors.TEXT_COLOR,
        fontSize: 14
    },
    rightContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center'
    },
    chip: {
        marginLeft: 10,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        height: 20
    },
    chipLabel: {
        fontSize: 10,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.WHITE,
        paddingHorizontal: 10,
        letterSpacing: 0.2
    },

})