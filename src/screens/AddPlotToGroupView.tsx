import { FlatList, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useRoute, RouteProp } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from 'src/components/common/Header'
import { Colors, Typography } from 'src/utils/constants'
import { RealmSchema } from 'src/types/enum/db.enum'
import { MonitoringPlot, PlotGroups } from 'src/types/interface/slice.interface'
import { useRealm } from '@realm/react'
import { formatRelativeTimeCustom } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import BouncyCheckbox from 'react-native-bouncy-checkbox/build/dist/BouncyCheckbox'
import useMonitoringPlotMangement from 'src/hooks/realm/useMonitoringPlotMangement'
import i18next from 'src/locales/index'

const AddPlotToGroupView = () => {
    const route = useRoute<RouteProp<RootStackParamList, 'AddPlotsToGroup'>>()
    const [groupPlots, setGroupPlots] = useState<string[]>([])
    const [groupName, setGroupName] = useState<string>('')
    const [plotList, setPlotList] = useState<MonitoringPlot[] | any>([])
    const groupId = route.params && route.params.groupId ? route.params.groupId : ''
    const realm = useRealm()
    const { addPlotToGroup, removePlotFromGroup } = useMonitoringPlotMangement()

    useEffect(() => {
        if (groupId) {
            getGroupDetails()
            getPlotList()
        }
    }, [groupId])



    const getGroupDetails = () => {
        const data = realm.objectForPrimaryKey<PlotGroups>(RealmSchema.PlotGroups, groupId);
        if (data) {
            const getAllIds = data.plots.map(el => el.plot_id)
            setGroupPlots(getAllIds)
            setGroupName(data.name)
        }
    }

    const getPlotList = () => {
        const data = realm.objects<MonitoringPlot>(RealmSchema.MonitoringPlot).filtered("lastScreen != 'form'");
        if (data && data.length > 0) {
            const filterdData = []
            data.forEach(el => {
                if (!el.plot_group || el.plot_group.length === 0) {
                    filterdData.push(el)
                }
                if (el.plot_group && el.plot_group.length > 0 && el.plot_group[0].group_id == groupId) {
                    filterdData.push(el)
                }
            })
            setPlotList(filterdData)
        }
    }

    const isPlotPresent = (id: string) => {
        return groupPlots.includes(id)
    }

    const updateCheck = async (item: MonitoringPlot) => {
        if (!groupPlots.includes(item.plot_id)) {
            await addPlotToGroup(groupId, item)
            setGroupPlots([...groupPlots, item.plot_id])
        } else {
            await removePlotFromGroup(groupId, item.plot_id)
            setGroupPlots([...groupPlots.filter(el => el !== item.plot_id)])

        }
    }



    const renderCardItems = (item: MonitoringPlot, index: number) => {
        const shouldCheck = isPlotPresent(item.plot_id)
        return (<View style={[styles.cardWrapper, { borderBottomWidth: index < plotList.length - 1 ? 0.5 : 0 }]}>
            <View style={styles.sectionWrapper}>
                <Text style={styles.cardheader}>{item.name}</Text>
                <Text style={styles.cardLabel}>{item.observations.length} observations | last updated {formatRelativeTimeCustom(item.plot_updated_at)}</Text>
            </View>
            <View style={styles.checkBoxWrapper}>
                <BouncyCheckbox
                    size={25}
                    fillColor={Colors.NEW_PRIMARY}
                    unFillColor={Colors.WHITE}
                    innerIconStyle={{ borderWidth: 2, borderColor: shouldCheck ? Colors.NEW_PRIMARY : Colors.TEXT_LIGHT, borderRadius: 5, margin: 0 }}
                    iconStyle={{ borderWidth: 2, borderColor: Colors.NEW_PRIMARY, borderRadius: 5, margin: 0 }}
                    onPress={() => {
                        updateCheck(item)
                    }}
                    style={{ width: 30 }}
                    isChecked={shouldCheck}
                />
            </View>
        </View>)
    }



    return (
        <SafeAreaView style={styles.container}>
            <Header label={'Add Plots to Group'} note={groupName} />
            <View style={styles.mainWrappe}>
                <View style={styles.wrapper}>
                    <FlatList
                        style={[styles.flatListWrapper, { backgroundColor: plotList.length > 0 ? Colors.WHITE : 'transparent' }]}
                        data={plotList} renderItem={({ item, index }) => renderCardItems(item, index)} ListEmptyComponent={() => {
                            return (
                                <View style={styles.emptyWrapper}>
                                    <Text style={styles.emptyLabel}>
                                        {i18next.t('label.no_plots')}
                                    </Text>
                                </View>
                            )
                        }} />
                </View>
            </View>
        </SafeAreaView>
    )
}

export default AddPlotToGroupView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE,
    },
    mainWrappe: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: Colors.BACKDROP_COLOR,
    },
    wrapper: {
        width: '90%',
        justifyContent: 'center',
        alignItems: 'center',
        maxHeight: '90%',
    },
    inputWrapper: {
        width: '95%'
    },
    emptyWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyLabel: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_LIGHT,
        width: '100%',
        textAlign: 'center',
        letterSpacing: 1
    },
    flatListWrapper: {
        marginTop: 50,
        width: '98%',
        paddingVertical: 15,
        borderRadius: 10,
        backgroundColor: Colors.WHITE
    },
    cardWrapper: {
        width: '94%',
        flexDirection: "row",
        alignItems: 'center',
        marginLeft: '3%',
        paddingHorizontal: 10,
        borderBottomWidth: 0.5,
        borderColor: Colors.GRAY_LIGHT,
        paddingVertical: 10,
        paddingBottom: 15

    },
    sectionWrapper: {
        flex: 14,
    },
    cardheader: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR,
        letterSpacing: 0.4
    },
    cardLabel: {
        fontSize: 12,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_LIGHT,
        letterSpacing: 0.4
    },
    checkBoxWrapper: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: "center"
    }
})