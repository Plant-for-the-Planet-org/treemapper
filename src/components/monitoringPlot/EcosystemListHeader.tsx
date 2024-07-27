import { FlatList, Pressable, StyleSheet, Text } from 'react-native'
import React from 'react'

import { Colors, Typography } from 'src/utils/constants'
import { PlotObservation } from 'src/types/interface/slice.interface'

interface Props {
    item: PlotObservation[],
    selectedLabel: string
    onPress: (s: string) => void
}


const EcosystemListHeader = (props: Props) => {

    const { selectedLabel, onPress, item } = props;
    const selectedTextStyle = {
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.WHITE
    }
    const selectedWrapper = {
        borderColor: Colors.NEW_PRIMARY,
        backgroundColor: Colors.NEW_PRIMARY,
    }
    const unslectedTextWrapper = {
        borderColor: Colors.GRAY_LIGHT,
        backgroundColor: Colors.WHITE,
    }
    const unslectedTextStyle = {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_COLOR
    }
    const canopyLength = item.filter(el => el.type === 'CANOPY').length
    const soilMoistureLength = item.filter(el => el.type === 'SOIL_MOISTURE').length
    const bioacusticsLength = item.filter(el => el.type === 'BIOACUSTICS').length


    const headerData = [{
        key: 'all',
        label: `All ${item.length}`,
        hide: false
    },
    {
        key: 'canopy',
        label: `${canopyLength} Canopy Cover`,
        hide: canopyLength === 0
    },
    {
        key: 'soil_moisture',
        label: `${soilMoistureLength} Soil Moisture`,
        hide: soilMoistureLength === 0

    },
    {
        key: 'bioacustics',
        label: `${bioacusticsLength} Bioacoustics`,
        hide: bioacusticsLength === 0

    }
    ]

    if (item.length === 0) {
        return null
    }
    return (
        <FlatList
            data={headerData}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
            renderItem={({ item }) => {
                if (item.hide) {
                    return null
                }
                return (
                    <Pressable style={[styles.sectionWrapper, selectedLabel === item.key ? selectedWrapper : unslectedTextWrapper]} onPress={() => {
                        onPress(item.key)
                    }}>
                        <Text style={[styles.sectionHeader, selectedLabel === item.key ? selectedTextStyle : unslectedTextStyle]}>{item.label}</Text>
                    </Pressable>
                )

            }} />
    )
}

export default EcosystemListHeader

const styles = StyleSheet.create({
    container: {
        paddingVertical: 10,
        marginVertical: 10,
        paddingHorizontal: 10
    },
    sectionWrapper: {
        flex: 1,
        marginLeft: 20,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 1
    },
    sectionHeader: {
        fontSize: 14,
    },
})