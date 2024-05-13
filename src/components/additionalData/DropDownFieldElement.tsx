import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import Modal from 'react-native-modal'
import CustomTextInput from '../common/CustomTextInput'
import CustomButton from '../common/CustomButton'
import { scaleSize } from 'src/utils/constants/mixins'
import { useToast } from 'react-native-toast-notifications'
import { v4 as uuid } from 'uuid';
import BinIcon from 'assets/images/svg/BinIcon.svg'

interface Props {
    isVisible: boolean
    toogleModal: () => void
    addOption: (d: { key: string, value: string, id: string }) => void
    selectedElement: { key: string, value: string, id: string }
    updateElement: (d: { key: string, value: string, id: string }) => void
    deleteElement: (d: { key: string, value: string, id: string }) => void
}

const DropDownFieldElement = (props: Props) => {
    const { isVisible, toogleModal, addOption, selectedElement, updateElement, deleteElement } = props
    const [inputKey, setInputKey] = useState('')
    const [inputValue, setInputValue] = useState('')
    const toast = useToast();

    useEffect(() => {
        if (selectedElement && selectedElement.key) {
            setInputKey(selectedElement.key)
            setInputValue(selectedElement.value)
        }else{
            setInputKey('')
            setInputValue('')
        }
    }, [selectedElement])


    const handlePress = () => {
        if (inputKey === '') {
            toast.show("Please add valid key")
            return;
        }
        if (inputValue === '') {
            toast.show("Please add valid value")
            return;
        }

        if (selectedElement.key.length > 0) {
            updateElement({
                key: inputKey,
                value: inputValue,
                id: selectedElement.id
            })
        } else {
            addOption({
                key: inputKey,
                value: inputValue,
                id: uuid()
            })
            setInputKey('')
            setInputValue('')
        }


        toogleModal()
    }

    const handleDelete = () => {
        deleteElement(selectedElement)
    }

    return (
        <Modal style={styles.container} isVisible={isVisible} onBackButtonPress={toogleModal} onBackdropPress={toogleModal}>
            <View style={styles.sectionWrapper}>
                {selectedElement.key.length > 0 && <TouchableOpacity
                    onPress={handleDelete}
                    style={styles.deleteBinWrapper}><BinIcon width={25} height={25} fill={'tomato'} /></TouchableOpacity>}
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
                    label={selectedElement.key.length > 0 ? "Update Option" : "Add Option"}
                    containerStyle={styles.btnContainer}
                    pressHandler={handlePress}
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
    deleteBinWrapper: {
        width: 30,
        height: 30,
        position: 'absolute',
        top: 10,
        right: 10,
        justifyContent: "center",
        alignItems: "center"
    }
})