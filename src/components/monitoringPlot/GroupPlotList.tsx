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


const GroupPlotList = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const handleSelection = () => {
        navigation.navigate('AddRemeasurment')
    }
    const handleNav = () => {
        navigation.navigate('AddPlotDetails')
    }
    return (
        <>
            <FlashList
                renderItem={({ item }) => (<GroupPlotCards item={item} handleSelection={handleSelection} />)}
                data={[1, 2, 3, 4, 5]} estimatedItemSize={100}
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
        paddingTop: 20
    },
    btnContainer: {
        width: '100%',
        height: scaleSize(70),
        position: 'absolute',
        bottom: 50,
    },
})

