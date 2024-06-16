import { FlatList, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from 'src/components/common/Header'
import { Colors, Typography } from 'src/utils/constants'
import { StackNavigationProp } from '@react-navigation/stack'
import { useToast } from 'react-native-toast-notifications'
import { RealmSchema } from 'src/types/enum/db.enum'
import { MonitoringPlot, PlotGroups } from 'src/types/interface/slice.interface'
import { useRealm } from '@realm/react'
import { formatRelativeTimeCustom } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import BouncyCheckbox from 'react-native-bouncy-checkbox/build/dist/BouncyCheckbox'

const AddPlotToGroupView = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const route = useRoute<RouteProp<RootStackParamList, 'AddPlotsToGroup'>>()
    const [groupPlots, setGroupPlots] = useState<string[]>([])
    const [groupName, setGroupName] = useState<string>('')
    const [plotList, setPlotList] = useState<MonitoringPlot[] | any>([])
    console.log("KLsdc", groupPlots)
    const groupId = route.params && route.params.groupId ? route.params.groupId : ''
    const toast = useToast()
    const realm = useRealm()

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
        } else {
            toast.show("No plot details found")
            navigation.goBack()
        }
    }

    const getPlotList = () => {
        const data = realm.objects(`${RealmSchema.MonitoringPlot}`);
        if (data && data.length > 0) {
            setPlotList(data)
        } else {
            toast.show("No plot details found")
        }
    }
    const renderCardItems = (item: MonitoringPlot, index: number) => {
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
                    innerIconStyle={{ borderWidth: 2, borderColor: Colors.TEXT_LIGHT, borderRadius: 5, margin: 0 }}
                    iconStyle={{ borderWidth: 2, borderColor: Colors.NEW_PRIMARY, borderRadius: 5, margin: 0 }}
                    onPress={() => {
                        // changeInterventionFilter(el.key)
                    }}
                    style={{ width: 30 }}
                    isChecked={false}
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
                        style={styles.flatListWrapper}
                        data={plotList} renderItem={({ item, index }) => renderCardItems(item, index)} ListEmptyComponent={() => {
                            return (
                                <View style={styles.emptyWrapper}>
                                    <Text style={styles.emptyLabel}>
                                        {"No Plot's to show"}
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
        color: Colors.TEXT_COLOR,
        width: '100%',
        textAlign: 'center',
        marginTop: 100,
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