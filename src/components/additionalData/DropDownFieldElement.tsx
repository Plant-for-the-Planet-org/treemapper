import { StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import Modal from 'react-native-modal'
import CustomTextInput from '../common/CustomTextInput'
import CustomButton from '../common/CustomButton'
import { scaleSize } from 'src/utils/constants/mixins'


interface Props {
    isVisible: boolean
    toogleModal: () => void
}

const DropDownFieldElement = (props: Props) => {
    const { isVisible, toogleModal } = props
    const [inputKey, setInputKey] = useState('')
    const [inputValue, setInputValue] = useState('')
    return (
        <Modal style={styles.container} isVisible={isVisible} onBackButtonPress={toogleModal} onBackdropPress={toogleModal}>
            <View style={styles.sectionWrapper}>
                <Text style={styles.header}>Add Dropdown options</Text>
                <CustomTextInput
                    label="Field key"
                    onChangeHandler={setInputKey}
                    value={inputKey}
                />
                <CustomTextInput
                    label="Field value"
                    onChangeHandler={setInputValue}
                    value={inputValue}
                />
                <CustomButton
                    label="Add Option"
                    containerStyle={styles.btnContainer}
                    pressHandler={() => { }}
                    hideFadein
                />
            </View>
        </Modal>
    )
}

export default DropDownFieldElement

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        margin: 0,
        padding: 0
    },
    sectionWrapper: {
        width: '90%',
        paddingVertical: 20,
        backgroundColor: Colors.WHITE,
        borderRadius: 8
    },
    header: {
        fontSize: 20,
        fontFamily: Typography.FONT_FAMILY_BOLD,
        color: Colors.TEXT_COLOR,
        marginLeft: 20,
        marginVertical: 10
    },
    btnContainer: {
        width: '100%',
        height: scaleSize(70),
        marginTop: 20
    },
})