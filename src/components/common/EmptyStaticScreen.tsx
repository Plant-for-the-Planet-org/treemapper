import { StyleSheet, Text, View, ViewStyle } from 'react-native'
import React from 'react'
import { Colors, Typography } from 'src/utils/constants'

interface Props {
    label: string,
    note: string,
    image: React.ReactElement
    marginTop: ViewStyle
}

const EmptyStaticScreen = (props: Props) => {
    const { label, note, image, marginTop } = props
    return (
        <View style={styles.container}>
            <View style={[styles.imageWrapper, marginTop]}>
                {image}
            </View>
            <Text style={styles.labelWrapper}>{label}</Text>
            <Text style={styles.noteWrapper}>{note}</Text>
        </View>
    )
}

export default EmptyStaticScreen

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    imageWrapper: {
        height: 150,
        marginBottom: '10%'
    },
    labelWrapper: {
        fontFamily: Typography.FONT_FAMILY_BOLD,
        color: Colors.DARK_TEXT_COLOR,
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 20
    },
    noteWrapper: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_COLOR,
        fontSize: 16,
        textAlign: 'center'
    }
})