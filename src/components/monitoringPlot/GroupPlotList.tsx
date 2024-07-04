import React from 'react'
import { FlashList } from '@shopify/flash-list'
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
import useMonitoringPlotMangement from 'src/hooks/realm/useMonitoringPlotMangement'
import EmptyIcom from 'assets/images/svg/EmptyGroupIcon.svg'
import EmptyStaticScreen from '../common/EmptyStaticScreen'
import i18next from 'src/locales/index'


const GroupPlotList = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const handleSelection = (gid: string) => {
        navigation.navigate('AddPlotGroup', { isEdit: true, groupId: gid })
    }
    const { deletePlotGroup } = useMonitoringPlotMangement()
    const handleNav = () => {
        navigation.navigate('AddPlotGroup')
    }

    const groupList = useQuery<PlotGroups>(
        RealmSchema.PlotGroups,
        data => {
            return data
        },
    )

    const deleteGroupData = (gid: string) => {
        deletePlotGroup(gid)
    }

    return (
        <>
            <FlashList
                renderItem={({ item }) => (<GroupPlotCards
                    deleteGroup={deleteGroupData}
                    item={item} handleSelection={handleSelection} />)}
                data={groupList} estimatedItemSize={100}
                contentContainerStyle={styles.container}
                ListEmptyComponent={<EmptyStaticScreen label={i18next.t('label.no_plots')} note={i18next.t('label.no_groups_note')} image={<EmptyIcom />} marginTop={{ marginTop: '25%' }} />}
            />
            <CustomButton
                label={i18next.t('label.add_group')}
                containerStyle={styles.btnContainer}
                pressHandler={handleNav}
                hideFadein
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

