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


const GroupPlotList = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const handleSelection = (gid: string) => {
        navigation.navigate('AddPlotGroup', { isEdit: true, groupId: gid })
    }
    const handleNav = () => {
        navigation.navigate('AddPlotGroup')
    }

    const groupList = useQuery<PlotGroups>(
        RealmSchema.PlotGroups,
        data => {
            return data
        },
    )


    return (
        <>
            <FlashList
                renderItem={({ item }) => (<GroupPlotCards item={item} handleSelection={handleSelection} />)}
                data={groupList} estimatedItemSize={100}
                contentContainerStyle={styles.container}
            />
            <CustomButton
                label="Add Group"
                containerStyle={styles.btnContainer}
                pressHandler={handleNav}
                hideFadein
            />
        </>
    )
}

export default GroupPlotList

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.BACKDROP_COLOR,
        paddingTop: 10
    },
    btnContainer: {
        width: '100%',
        height: scaleSize(70),
        position: 'absolute',
        bottom: 50,
    },
})

