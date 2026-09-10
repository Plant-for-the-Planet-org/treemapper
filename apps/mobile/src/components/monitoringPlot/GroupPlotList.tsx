import React, { useEffect } from 'react'
import { FlashList } from '@shopify/flash-list'
import { useToast } from 'react-native-toast-notifications'
import { StyleSheet } from 'react-native'
import { Colors } from 'src/utils/constants'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import GroupPlotCards from './GroupPlotCards'
import { scaleSize } from 'src/utils/constants/mixins'
import CustomButton from '../common/CustomButton'
import { PlotGroups } from 'src/types/interface/slice.interface'
import { useQuery } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import useMonitoringPlotManagement from 'src/hooks/realm/useMonitoringPlotManagement'
import EmptyIcon from 'assets/images/svg/EmptyGroupIcon.svg'
import EmptyStaticScreen from '../common/EmptyStaticScreen'
import i18next from 'src/locales/index'


const GroupPlotList = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const toast = useToast()
    const handleSelection = (gid: string) => {
        navigation.navigate('AddPlotGroup', { isEdit: true, groupId: gid })
    }
    const { deletePlotGroup, reconcilePlotGroups } = useMonitoringPlotManagement()
    const handleNav = () => {
        navigation.navigate('AddPlotGroup')
    }

    const groupList = useQuery<PlotGroups>(
        RealmSchema.PlotGroups,
        data => {
            return data
        },
    )

    // A plot added to or removed from a group while offline leaves the server
    // holding a stale member list. Opening this screen is the natural moment to
    // put that right, and it costs nothing when nothing has drifted.
    useEffect(() => {
        reconcilePlotGroups()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const deleteGroupData = async (gid: string) => {
        const result = await deletePlotGroup(gid)
        if (result.ok) return
        if (result.reason === 'offline') {
            toast.show(i18next.t('label.group_delete_needs_internet'), { textStyle: { textAlign: 'center' } })
            return
        }
        toast.show(i18next.t('label.group_delete_failed'))
    }

    return (
        <>
            <FlashList
                renderItem={({ item }) => (<GroupPlotCards
                    deleteGroup={deleteGroupData}
                    item={item} handleSelection={handleSelection} />)}
                data={[...groupList]} estimatedItemSize={100}
                contentContainerStyle={styles.container}
                ListEmptyComponent={<EmptyStaticScreen label={i18next.t('label.no_plots')} note={i18next.t('label.no_groups_note')} image={<EmptyIcon />} marginTop={{ marginTop: '25%' }} />}
            />
            <CustomButton
                label={i18next.t('label.add_group')}
                containerStyle={styles.btnContainer}
                pressHandler={handleNav}
                hideFadeIn
                showAdd
            />
        </>
    )
}

export default GroupPlotList

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.BACKDROP_COLOR,
        paddingTop: 10,
    },
    btnContainer: {
        width: '100%',
        height: scaleSize(70),
        position: 'absolute',
        bottom: 10,
    },
})

