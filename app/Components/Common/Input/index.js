import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Modal, TouchableOpacity, SafeAreaView } from 'react-native';
import { Colors, Typography } from '_styles';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'

const Input = ({ label, value, onChangeText, dataKey, index, editable, keyboardType, placeholder, onBlur }) => {

    const input = useRef(null)
    const [isOpen, setIsOpen] = useState(false)

    const onChange = (text) => {
        onChangeText(text, dataKey, index)
    }

    const onPressLabel = () => {
        setIsOpen(!isOpen)
        // input.current.focus()
    }

    const onSubmit = () => {
        onBlur()
        setIsOpen(!isOpen)
    }
    return (
        <View style={styles.container}>
            <Modal transparent={true} visible={isOpen}>
                <SafeAreaView style={{ flex: 1, }}>
                    <View style={{ flex: 1, }}>
                        <View style={{ flex: 1 }} />
                        <View style={styles.externalInputContainer}>
                            <TextInput ref={input} onBlur={onSubmit} placeholderTextColor={Colors.TEXT_COLOR} placeholder={placeholder} keyboardType={keyboardType} value={value} onChangeText={onChange} style={styles.value} autoFocus onSubmitEditing={onSubmit} />
                            <MCIcon onPress={onSubmit} name={'check'} size={30} color={Colors.PRIMARY} />
                        </View>
                    </View>
                </SafeAreaView>
            </Modal>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity disabled={editable == false} onPress={onPressLabel} style={styles.valueContainer}>
                <Text onBlur={onBlur} placeholderTextColor={Colors.TEXT_COLOR} placeholder={placeholder} keyboardType={keyboardType} editable={false} value={value} onChangeText={onChange} style={styles.value}>{value ? value : placeholder}</Text>
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
    value: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_20,
        lineHeight: Typography.LINE_HEIGHT_40,
        color: Colors.TEXT_COLOR,
        fontWeight: Typography.FONT_WEIGHT_MEDIUM,
        flex: 1,
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
        paddingHorizontal: 5,
        borderTopWidth: .5,
        borderColor: Colors.TEXT_COLOR
    }
})