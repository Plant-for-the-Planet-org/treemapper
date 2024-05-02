import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import Modal from 'react-native-modal'
import { Colors, Typography } from 'src/utils/constants'
import FolderIcon from 'assets/images/svg/FolderIcon.svg'

interface Props {
    isVisible: boolean
    toogleModal: ()=>void
    handleFreeSpace: () => void
}

const ClearSpaceModal = (props: Props) => {
    const { isVisible, toogleModal, handleFreeSpace } = props

    return (
        <Modal
            style={styles.container}
            isVisible={isVisible}
            onBackdropPress={toogleModal}>
            <View style={styles.sectionWrapper}>
                <View style={styles.contentContainer}>
                    <FolderIcon />
                    <Text
                        style={{
                            color: Colors.TEXT_COLOR,
                            fontFamily: Typography.FONT_FAMILY_BOLD,
                            fontSize: Typography.FONT_SIZE_14,
                            paddingVertical: 10,
                        }}>
                        Clear Up Some Space
                    </Text>
                    <Text style={[styles.accuracyModalText, { marginBottom: 16 }]}>
                        Reclaim storage by removing local copies of images. All files will continue to be available in the cloud.
                    </Text>
                    <TouchableOpacity
                        onPress={handleFreeSpace}
                        style={{
                            paddingHorizontal:10,
                            paddingVertical:5,
                            alignSelf: 'center',
                        }}>
                        <Text
                            style={{
                                color: Colors.NEW_PRIMARY,
                                fontFamily: Typography.FONT_FAMILY_BOLD,
                                fontSize: Typography.FONT_SIZE_16,
                            }}>
                            Free up space
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}

export default ClearSpaceModal

const styles = StyleSheet.create({
    container: {
        flex: 1,
        margin: 0,
        justifyContent: 'center',
        alignItems: 'center'
    },
    sectionWrapper: {
        width: '80%',
        position: 'absolute',
        backgroundColor: Colors.WHITE,
        borderRadius: 20,
        alignItems: 'center',
        minHeight: '40%',
        paddingVertical: 20
    },
    contentContainer: {
        backgroundColor: Colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        paddingLeft: 25,
        paddingRight: 15,
        paddingVertical: 25,
    },
    accuracyModalText: {
        color: '#000000',
        lineHeight: Typography.LINE_HEIGHT_20,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_12,
        textAlign: 'center',
        paddingHorizontal: 15
    },
})