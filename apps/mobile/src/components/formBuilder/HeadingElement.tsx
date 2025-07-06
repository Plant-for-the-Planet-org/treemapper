import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { FormElement } from 'src/types/interface/form.interface'

interface Props {
    data: FormElement
}

const HeadingElement = (props: Props) => {
    const { data } = props
    return (
        <View style={styles.container}>
            <View style={styles.wrapper}>
                <Text style={styles.label}>
                    {data.label}
                </Text>
            </View>
        </View>
    )
}

export default HeadingElement

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginTop: 10,
        marginBottom: 15,
        justifyContent: 'center',
        alignItems:'center'
    },
    wrapper: {
        width: '90%',
    },
    label: {
        fontSize: 22,
        fontFamily: Typography.FONT_FAMILY_BOLD,
        color: Colors.TEXT_COLOR
    }
})