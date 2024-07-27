import { StyleSheet, View } from 'react-native'
import React from 'react'
import Modal from 'react-native-modal'
import { Colors } from 'src/utils/constants'
import GpsAccuracyInfoContent from '../map/GpsAccuracyInfoContent'


interface Props {
    isVisible: boolean
    toggleModal: (b:boolean) => void
}

const InfoModal = (props: Props) => {
    const { isVisible, toggleModal: toggleModal } = props
    const handleClose=()=>{
        toggleModal(!isVisible)
    }
    return (
        <Modal
            style={styles.container}
            isVisible={isVisible}
            onBackdropPress={handleClose}>
            <View style={styles.sectionWrapper}>
                <GpsAccuracyInfoContent closeModal={handleClose}/>
            </View>
        </Modal>
    )
}

export default InfoModal

const styles = StyleSheet.create({
    container: {
        flex: 1,
        margin: 0,
        justifyContent:'center',
        alignItems:'center'
    },
    sectionWrapper: {
        width: '80%',
        position: 'absolute',
        backgroundColor: Colors.WHITE,
        borderRadius: 20,
        alignItems: 'center',
        minHeight:'40%',
        paddingVertical:20
    },

})