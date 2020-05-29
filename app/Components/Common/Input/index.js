import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Modal, TouchableOpacity, SafeAreaView, KeyboardAvoidingView } from 'react-native';
import { Colors, Typography } from '_styles';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'

const Input = ({ label, value, onChangeText, dataKey, index, editable, keyboardType, placeholder, onBlur, onSubmitEditing }) => {

    const input = useRef(null)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        // if (label == 'Tree Count') {
        //     setIsOpen(true)
        // }

    }, [])

    const onChange = (text) => {
        onChangeText(text, dataKey, index)
    }

    const onPressLabel = () => {
        setTimeout(() => setIsOpen(!isOpen), 0)

    }

    const onSubmit = () => {
        onSubmitEditing()
        // onBlur()
        setIsOpen(!isOpen)
    }
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity disabled={editable == false} onPress={onPressLabel} style={styles.valueContainer}>
                <Text style={styles.value}>{value ? value : placeholder}</Text>
            </TouchableOpacity>
        </View>
    )
}
export default Input

const styles = StyleSheet.create({
    container: {
        marginVertical: 10
    },
    label: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_30,
        color: Colors.TEXT_COLOR,
    },
    labelModal: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_30,
        color: Colors.TEXT_COLOR,
        marginRight: 10
    },
    value: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_20,
        color: Colors.TEXT_COLOR,
        fontWeight: Typography.FONT_WEIGHT_MEDIUM,
        flex: 1,
        paddingVertical: 10,
    },
    valueContainer: {
        borderBottomWidth: 2,
        borderBottomColor: Colors.TEXT_COLOR,
    },
    externalInputContainer: {
        flexDirection: 'row',
        height: 65,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 25,
        borderTopWidth: .5,
        borderColor: Colors.TEXT_COLOR
    },

})