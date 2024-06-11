import { FlatList, Pressable, StyleSheet, Text } from 'react-native'
import React from 'react'

import { Colors, Typography } from 'src/utils/constants'

interface Props {
    item?: any,
    selectedLabel: string
    onPress: (s: string) => void
}

const dummyData = ['all', 'cover', 'soil'];

const EcosystemListHeader = (props: Props) => {
    const { selectedLabel, onPress } = props;
    const selectedTextStyle = {
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.WHITE
    }
    const selectedWrapper = {
        borderColor: Colors.NEW_PRIMARY,
        backgroundColor: Colors.NEW_PRIMARY,
    }
    const unslectedTextWrapper = {
        borderColor: Colors.TEXT_LIGHT,
        backgroundColor: Colors.WHITE,
    }
    const unslectedTextStyle = {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_COLOR
    }


    return (
        <FlatList
            data={dummyData}
            horizontal
            contentContainerStyle={styles.container}
            renderItem={({ item }) => {
                return (
                    <Pressable style={[styles.sectionWrapper, selectedLabel === item ? selectedWrapper : unslectedTextWrapper]} onPress={() => {
                        onPress(item)
                    }}>
                        <Text style={[styles.sectionHeader, selectedLabel === item ? selectedTextStyle : unslectedTextStyle]}>All 8</Text>
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