import { DimensionValue, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Typography } from 'src/utils/constants'

interface Props {
    width: DimensionValue
    height: DimensionValue
    size: number
    color: string
}

const DividerDot = (props: Props) => {
    const { width, height, size, color } = props;
    return (
        <View style={[styles.container, { width, height }]}>
            <Text style={[styles.dot, { color, fontSize: size }]}>.</Text>
        </View>
    )
}

export default DividerDot

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
        lineHeight:15
    }
})