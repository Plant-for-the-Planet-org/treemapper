import { Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'

const YeNoElement = () => {
    const [isTrue, setIsTrue] = useState(false)
    const handleChnage = (b: boolean) => {
        setIsTrue(b)
    }
    return (
        <View style={styles.container}>
            <Pressable style={[styles.singleWrapper, { backgroundColor: isTrue ? Colors.NEW_PRIMARY : Colors.NEW_PRIMARY + '1A' }]} onPress={() => { handleChnage(true) }}>
                <Text style={[styles.label, { color: isTrue ? Colors.WHITE : Colors.TEXT_COLOR }]}>Yes</Text>
            </Pressable>
            <Pressable style={[styles.singleWrapper, { backgroundColor: !isTrue ? Colors.NEW_PRIMARY : Colors.NEW_PRIMARY + '1A' }]} onPress={() => { handleChnage(false) }}>
                <Text style={[styles.label, { color: !isTrue ? Colors.WHITE : Colors.TEXT_COLOR }]}>No</Text>
            </Pressable>
        </View>
    )
}

export default YeNoElement

const styles = StyleSheet.create({
    container: {
        width: 100,
        height: 30,
        flexDirection: 'row',
    },
    singleWrapper: {
        width: 35,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center'
    },
    label: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD
    },
})