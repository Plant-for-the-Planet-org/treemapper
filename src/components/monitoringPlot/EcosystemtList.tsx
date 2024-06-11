import React, { useState } from 'react'
import { FlashList } from '@shopify/flash-list'
import { StyleSheet } from 'react-native'
import { Colors } from 'src/utils/constants'
import EcosystemCard from './EcosystemCard'
import EcosystemListHeader from './EcosystemListHeader'

const EcosystemList = () => {
    const [selectedLabel, setSelectedLabel] = useState('all')
    return (
        <FlashList
            renderItem={({ item }) => (<EcosystemCard item={item} />)} data={[1, 2, 3, 4, 5]}
            estimatedItemSize={100}
            ListHeaderComponent={<EcosystemListHeader onPress={setSelectedLabel} selectedLabel={selectedLabel}/>}
            contentContainerStyle={styles.container} />
    )
}

export default EcosystemList

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.BACKDROP_COLOR,
    }
})

