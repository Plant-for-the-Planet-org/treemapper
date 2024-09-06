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

const AskSampleTreeModal = (props: Props) => {
    const { isVisible, toggleModal, removeFavSpecie, extra, secondaryHandler } = props
    return (
        <Modal
            style={styles.container}
            isVisible={isVisible}
            onBackdropPress={() => { toggleModal(null) }}>
            <View style={styles.subContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <PinkHeart />
                    <Text style={styles.alertHeader}>
                        {props.headerLabel}
                    </Text>
                </View>
                <Text style={styles.alertMessage}>
                    {props.noteLabel}
                </Text>
                <View style={styles.bottomBtnContainer}>
                    <FlatButton
                        onPress={() => { secondaryHandler ? secondaryHandler(extra) : toggleModal(null) }}
                        text={props.secondaryLabel}
                        style={styles.secondaryButtonStyle}
                    />
                    <TouchableOpacity
                        onPress={() => { removeFavSpecie(extra) }}
                        style={styles.primaryButtonStyle}>
                        <Text style={[styles.removeLabel, { color: secondaryHandler ? Colors.NEW_PRIMARY : 'tomato' }]}>{props.primeLabel}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}

export default AskSampleTreeModal

const styles = StyleSheet.create({
    container: {
        flex: 1,
        margin: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentWrapper: {
        flex: 1,
        paddingTop: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subContainer: {
        width: '90%',
        backgroundColor: Colors.WHITE,
        borderRadius: 10,
        padding: 20,
    },
    alertHeader: {
        fontFamily: Typography.FONT_FAMILY_BOLD,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_24,
        color: Colors.BLACK,
        marginVertical: 10,
        marginLeft: 8,
    },
    alertMessage: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_16,
        lineHeight: Typography.LINE_HEIGHT_24,
        color: Colors.BLACK,
    },
    bottomBtnContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 24,
    },
    removeLabel: {
        fontFamily: Typography.FONT_FAMILY_BOLD,
        fontSize: Typography.FONT_SIZE_16,
        color: 'tomato',
        lineHeight: Typography.LINE_HEIGHT_24,
    },
    primaryButtonStyle: {
        marginLeft: 16,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    secondaryButtonStyle: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        fontFamily: Typography.FONT_FAMILY_BOLD,
        color: Colors.DARK_TEXT
    },
})
