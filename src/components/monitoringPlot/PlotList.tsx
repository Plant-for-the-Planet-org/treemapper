import React from 'react'
import { FlashList } from '@shopify/flash-list'
import PlotCards from './PlotCards'
import { StyleSheet } from 'react-native'
import { Colors } from 'src/utils/constants'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { MonitoringPlot } from 'src/types/interface/slice.interface'

interface Props {
    data: MonitoringPlot[] | any
}

const PlotList = (props: Props) => {
    const { data } = props
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const handleSelection = (id: string, lastScreen: string) => {
        if (lastScreen === 'form') {
            navigation.navigate('CreatePlotDetail', { id })
            return
        }

        if (lastScreen === 'details') {
            navigation.navigate('CreatePlotMap', { id })
            return
        }
        if (lastScreen === 'location') {
            navigation.navigate('PlotDetails', { id })
            return
        }
    }
    return (
        <FlashList
            renderItem={({ item }) => (<PlotCards item={item} handleSelection={handleSelection} />)}
            data={data} estimatedItemSize={100}
            contentContainerStyle={styles.container}
        />
    )
}

export default PlotList

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.BACKDROP_COLOR,
        paddingTop: 10,
        paddingBottom: 100
    }
})

