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
import { MonitoringPlot } from 'src/types/interface/slice.interface'



interface Props {
    plotID: string
    data: MonitoringPlot
}

const EcosystemList = ({ plotID , data}: Props) => {
    const [selectedLabel, setSelectedLabel] = useState('All 12')
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const handleNav = () => {
        navigation.navigate('AddObservationForm', { id: plotID })
    }
    return (
        <>
            <FlashList
                data={data.observations}
                renderItem={({ item }) => (<EcosystemCard item={item} />)}
                estimatedItemSize={100}
                ListHeaderComponent={<EcosystemListHeader 
                    item={data.observations}
                    onPress={setSelectedLabel} selectedLabel={selectedLabel} />}
                contentContainerStyle={styles.container} />
            <CustomButton
                label="Add Observation"
                containerStyle={styles.btnContainer}
                pressHandler={handleNav}
                hideFadein
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

