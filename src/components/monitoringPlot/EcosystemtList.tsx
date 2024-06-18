import React, { useEffect, useState } from 'react'
import { FlashList } from '@shopify/flash-list'
import { StyleSheet } from 'react-native'
import { Colors } from 'src/utils/constants'
import EcosystemCard from './EcosystemCard'
import EcosystemListHeader from './EcosystemListHeader'
import CustomButton from '../common/CustomButton'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { MonitoringPlot, PlotObservation } from 'src/types/interface/slice.interface'
import EmptyIcom from 'assets/images/svg/EmptyGroupIcon.svg'
import EmptyStaticScreen from '../common/EmptyStaticScreen'



interface Props {
    plotID: string
    data: MonitoringPlot
}

const EcosystemList = ({ plotID, data }: Props) => {
    const [selectedLabel, setSelectedLabel] = useState('all')
    const [observationData, setObservationData] = useState<PlotObservation[]>([])
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const handleNav = () => {
        navigation.navigate('AddObservationForm', { id: plotID })
    }

    useEffect(() => {
        if (selectedLabel === 'all') {
            setObservationData(data.observations)
        }
        if (selectedLabel === 'canopy') {
            setObservationData(data.observations.filter(el => el.type === 'CANOPY'))
        }
        if (selectedLabel === 'soil_moisture') {
            setObservationData(data.observations.filter(el => el.type === 'SOIL_MOISTURE'))
        }
    }, [selectedLabel,data.observations])


    return (
        <>
            <FlashList
                data={observationData}
                renderItem={({ item }) => (<EcosystemCard item={item} />)}
                estimatedItemSize={100}
                ListEmptyComponent={<EmptyStaticScreen label={'No Observation to Show'} note={'Tap the button below to add a new Obs.'}
                marginTop={{marginTop:'25%'}}
                image={<EmptyIcom />} />}
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
        bottom: 10,
    },
})

