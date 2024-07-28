import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { FormElement } from 'src/types/interface/form.interface'

interface Props {
    data: FormElement
    formValues: { [key: string]: any }
    changeHandler: (key: string, value: string) => void
}

const YeNoFormElement = (props: Props) => {
    const { data, formValues, changeHandler } = props

    const handleChange = () => {
        changeHandler(
            data.key,
            String(`${formValues[data.key].value === 'false' ? 'true' : 'false'}`),
        )
    }
    const isTrue = formValues[data.key].value === 'true'
    return (
        <View style={styles.mainContainer}>
            <View style={styles.mainWrapper}>
                <Text style={styles.noteLabel}>{data.label}</Text>
                <View style={styles.container}>
                    <Pressable style={[styles.singleWrapper, { backgroundColor: isTrue ? Colors.NEW_PRIMARY : Colors.NEW_PRIMARY + '1A' }]} onPress={handleChange}>
                        <Text style={[styles.label, { color: isTrue ? Colors.WHITE : Colors.TEXT_COLOR }]}>Yes</Text>
                    </Pressable>
                    <Pressable style={[styles.singleWrapper, { backgroundColor: !isTrue ? Colors.NEW_PRIMARY : Colors.NEW_PRIMARY + '1A' }]} onPress={handleChange}>
                        <Text style={[styles.label, { color: !isTrue ? Colors.WHITE : Colors.TEXT_COLOR }]}>No</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    )
}

export default YeNoFormElement

const styles = StyleSheet.create({
    mainContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    },
    mainWrapper: {
        width: '90%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        marginVertical: 5,
        justifyContent: 'space-between',
        marginBottom:10
    },
    noteLabel: {
        fontSize: 18,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR,
        width:'70%',
        marginLeft:15
    },
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