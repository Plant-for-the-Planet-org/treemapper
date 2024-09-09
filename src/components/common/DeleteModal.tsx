import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import Modal from 'react-native-modal'
import { Colors, Typography } from 'src/utils/constants'
import PinkHeart from 'assets/images/svg/InfoIcon.svg'
import FlatButton from '../common/FlatButton'

interface Props {
    isVisible: boolean
    toggleModal: (b: boolean) => void
    removeFavSpecie: (e: any) => void
    secondaryHandler?: (e: any) => void
    headerLabel: string
    noteLabel: string
    primeLabel: string
    secondaryLabel: string
    extra: any
}

const DeleteModal = (props: Props) => {
    const { isVisible, toggleModal, removeFavSpecie, extra, secondaryHandler } = props
    return (
        <Modal
            style={styles.containerDelete}
            isVisible={isVisible}
            onBackdropPress={() => { toggleModal(null) }}>
            <View style={styles.subContainerDelete}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <PinkHeart />
                    <Text style={styles.alertHeaderDelete}>
                        {props.headerLabel}
                    </Text>
                </View>
                <Text style={styles.alertMessageDelete}>
                    {props.noteLabel}
                </Text>
                <View style={styles.bottomBtnContainerDelete}>
                    <FlatButton
                        onPress={() => { secondaryHandler ? secondaryHandler(extra) : toggleModal(null) }}
                        text={props.secondaryLabel}
                        style={styles.secondaryButtonStyleDelete}
                    />
                    <TouchableOpacity
                        onPress={() => { removeFavSpecie(extra) }}
                        style={styles.primaryButtonStyleDelete}>
                        <Text style={[styles.removeLabelDelete, { color: secondaryHandler ? Colors.NEW_PRIMARY : 'tomato' }]}>{props.primeLabel}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}

export default DeleteModal

const styles = StyleSheet.create({
    containerDelete: {
        flex: 1,
        margin: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentWrapperDelete: {
        flex: 1,
        paddingTop: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subContainerDelete: {
        width: '90%',
        backgroundColor: Colors.WHITE,
        borderRadius: 10,
        padding: 20,
    },
    alertHeaderDelete: {
        fontFamily: Typography.FONT_FAMILY_BOLD,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_24,
        color: Colors.BLACK,
        marginVertical: 10,
        marginLeft: 8,
    },
    alertMessageDelete: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_16,
        lineHeight: Typography.LINE_HEIGHT_24,
        color: Colors.BLACK,
    },
    bottomBtnContainerDelete: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 24,
    },
    removeLabelDelete: {
        fontFamily: Typography.FONT_FAMILY_BOLD,
        fontSize: Typography.FONT_SIZE_16,
        color: 'tomato',
        lineHeight: Typography.LINE_HEIGHT_24,
    },
    primaryButtonStyleDelete: {
        marginLeft: 16,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    secondaryButtonStyleDelete: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        fontFamily: Typography.FONT_FAMILY_BOLD,
        color: Colors.DARK_TEXT
    },
})
