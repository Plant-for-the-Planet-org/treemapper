import {StyleSheet, Text} from 'react-native'
import React from 'react'
import Modal from 'react-native-modal'

interface Props {
  isVisible: boolean,
  toogleModal: ()=>void
}

const HomeModal = (props: Props) => {
  const {isVisible, toogleModal} = props
  return (
    <Modal style={styles.container} isVisible={isVisible} onBackdropPress={toogleModal}>
      <Text style={{color: 'white'}}>AppModal</Text>
    </Modal>
  )
}

export default HomeModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
