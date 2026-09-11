import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import i18next from 'src/locales/index'
import { Colors, Typography } from 'src/utils/constants'
import DividerDot from '../common/DividerDot'
import { MonitoringPlot } from 'src/types/interface/slice.interface'
import { formatRelativeTimeCustom } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import { updateFilePath } from 'src/utils/helpers/fileSystemHelper'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'

interface Props {
    item: MonitoringPlot
    handleSelection: (id: string, lastScreen: string) => void
}

const PlotCards = (props: Props) => {
    const { handleSelection, item } = props;
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

    // A plot the server refused, or one whose payload could not be built, stays
    // out of the sync queue until it is edited. Say so on the card, otherwise the
    // plot just sits there looking unsynced with no reason given.
    const fixLabel = () => {
        if (item.fix_required === 'SERVER_REJECTED') return i18next.t('label.plot_upload_rejected')
        if (item.fix_required === 'UNKNOWN') return i18next.t('label.plot_incomplete_data')
        return i18next.t('label.plot_fix_required')
    }

    const renderLabel = () => {
        let l = ''
        if (item.complexity === 'SIMPLE') l += "Simple"
        if (item.complexity === 'STANDARD') l += "Standard"
        if (item.type === 'CONTROL') l += " Control"
        if (item.type === 'INTERVENTION') l += " Intervention"
        return l + ' Plot'
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.wrapper} onPress={() => { handleSelection(item.plot_id, item.lastScreen) }}>
                {item.local_image
                    ? <Image source={{ uri: updateFilePath(item.local_image) }} style={styles.avatar} />
                    : <View style={styles.avatar}>
                        <MaterialCommunityIcons name="tree" size={36} color={Colors.NEW_PRIMARY} />
                    </View>
                }
                <View style={styles.sectionWrapper}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.idLabel}>{item.name}</Text>
                        {item.fix_required !== 'NO'
                            ? <View style={styles.sectionHeader}>
                                <Text style={styles.fixChipLabel}>{fixLabel()}</Text>
                            </View>
                            : item.lastScreen !== 'location' && <View style={styles.sectionHeader}>
                                <Text style={styles.chipLabel}>{i18next.t("label.incomplete")}</Text>
                            </View>}
                    </View>
                    {item.fix_required !== 'NO' && !!item.fix_reason ? (
                        // One line of the real reason. The full text and what to do
                        // about it are on the plot itself, which this row opens.
                        <Text style={styles.fixReasonLabel} numberOfLines={2}>{item.fix_reason}</Text>
                    ) : (
                        <View style={styles.sectionHeader}>
                            <Text style={styles.plantedLabel}>{renderLabel()}</Text>
                            <DividerDot width={20} height={20} size={20} color={Colors.DARK_TEXT_COLOR} />
                            <Text style={styles.plantedLabel}>{item.observations.length} obs.</Text>
                        </View>
                    )}
                    <Text style={styles.speciesLabel}>{formatRelativeTimeCustom(item.plot_created_at)}</Text>
                </View>
                {item.plot_group.length > 0 && <View style={styles.plotDetailsWrapper}>
                    <Text style={styles.plotTitle}>{item.plot_group[0].name}</Text>
                </View>}
                <TouchableOpacity
                    style={styles.galleryIconWrapper}
                    onPress={() => navigation.navigate('PlotGallery', { id: item.plot_id })}>
                    <MaterialCommunityIcons
                        name={item.local_image ? 'image-multiple-outline' : 'image-plus'}
                        size={18}
                        color={Colors.NEW_PRIMARY}
                    />
                </TouchableOpacity>
            </TouchableOpacity>
        </View >
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
        flexDirection: 'row',
    },
    incompleteChip: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#FCF4DB"
    },
    chipLabel: {
        fontSize: 10,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        letterSpacing: 0.2,
        paddingHorizontal: 10,
        paddingVertical: 5,
        color: "#F39F53"
    },
    fixReasonLabel: {
        fontSize: 11,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.ALERT,
        lineHeight: 15,
        paddingRight: 40,
    },
    fixChipLabel: {
        fontSize: 10,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        letterSpacing: 0.2,
        paddingHorizontal: 10,
        paddingVertical: 5,
        color: Colors.ALERT
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
        color: Colors.TEXT_LIGHT
    },
    plantedLabel: {
        fontSize: 11,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_LIGHT,
        letterSpacing: 0.2
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
    },
    galleryIconWrapper: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: Colors.WHITE,
        borderRadius: 20,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.GRAY_TEXT,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 2,
    }
})