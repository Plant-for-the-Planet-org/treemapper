import React, { useState } from 'react'
import { FlashList } from '@shopify/flash-list'
import { StyleSheet } from 'react-native'
import { Colors } from 'src/utils/constants'
import EcosystemCard from './EcosystemCard'
import EcosystemListHeader from './EcosystemListHeader'
import CustomButton from '../common/CustomButton'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'

const dummyData = [
    {
        type: 'soil',
        title: 'Soil Moisture',
        value: '112 kPa',
        date: '1d ago',
    },
    {
        type: 'canopy',
        title: 'Canopy Cover',
        value: '65%',
        date: '6hrs ago',
    },
    {
        type: 'bio',
        title: 'Soil Moisture',
        value: '65%',
        date: '12d ago',
    },
    {
        type: 'soil',
        title: 'Bioacustics',
        value: 'not analysed',
        date: '3d ago',
    },
    {
        type: 'soil',
        title: 'Soil Moisture',
        value: '65%',
        date: '6d ago',
    },
    {
        type: 'soil',
        title: 'Soil Moisture',
        value: '90 kPa',
        date: '2d ago',
    },
    {
        type: 'soil',
        title: 'Soil Moisture',
        value: '112 kPa',
        date: '1d ago',
    },
    {
        type: 'canopy',
        title: 'Canopy Cover',
        value: '65%',
        date: '6hrs ago',
    },
    {
        type: 'bio',
        title: 'Soil Moisture',
        value: '65%',
        date: '12d ago',
    },
    {
        type: 'soil',
        title: 'Bioacustics',
        value: 'not analysed',
        date: '3d ago',
    },
    {
        type: 'soil',
        title: 'Soil Moisture',
        value: '65%',
        date: '6d ago',
    },
    {
        type: 'soil',
        title: 'Soil Moisture',
        value: '90 kPa',
        date: '2d ago',
    },
]

interface Props {
    plotID: string
}

const EcosystemList = ({ plotID }: Props) => {
    const [selectedLabel, setSelectedLabel] = useState('All 12')
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const handleNav = () => {
        navigation.navigate('AddObservationForm', { id: plotID })
    }
    return (
        <>
            <FlashList
                renderItem={({ item }) => (<EcosystemCard item={item} />)} data={dummyData}
                estimatedItemSize={100}
                ListHeaderComponent={<EcosystemListHeader onPress={setSelectedLabel} selectedLabel={selectedLabel} />}
                contentContainerStyle={styles.container} />
            <CustomButton
                label="Add Observation"
                containerStyle={styles.btnContainer}
                pressHandler={handleNav}
            />
        </>
    )
}

export default EcosystemList

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.BACKDROP_COLOR,
    },
    btnContainer: {
        width: '100%',
        height: 70,
        position: 'absolute',
        bottom: 50,
    },
})

