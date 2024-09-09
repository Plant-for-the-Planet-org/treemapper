import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import Modal from 'react-native-modal'
import { Colors, Typography } from 'src/utils/constants'
import PinkHeart from 'assets/images/svg/PinkHeart.svg'
import i18next from 'i18next'
import FlatButton from '../common/FlatButton'

interface Props {
  isVisible: boolean
  toggleModal: () => void
  removeFavSpecie: () => void
}

const RemoveSpeciesModal = (props: Props) => {
  const { isVisible, toggleModal, removeFavSpecie } = props
  return (
    <Modal
      style={styles.containerModal}
      isVisible={isVisible}
      onBackdropPress={toggleModal}>
      <View style={styles.subContainerModal}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <PinkHeart />
          <Text style={styles.alertHeaderModal}>
            {i18next.t('label.remove_species')}
          </Text>
        </View>
        <Text style={styles.alertMessageModal}>
          {i18next.t('label.sure_remove_species')}
        </Text>
        <View style={styles.bottomBtnContainerModal}>
          <FlatButton
            onPress={toggleModal}
            text={i18next.t('label.cancel')}
            style={styles.secondaryButtonStyleModal}
          />
          <TouchableOpacity
            onPress={removeFavSpecie}
            style={styles.primaryButtonStyleModal}>
            <Text style={styles.removeLabelModal}>{i18next.t('label.remove')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

export default RemoveSpeciesModal

const styles = StyleSheet.create({
  containerModal: {
    flex: 1,
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapperModal: {
    flex: 1,
    paddingTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subContainerModal: {
    width: '90%',
    backgroundColor: Colors.WHITE,
    borderRadius: 10,
    padding: 20,
  },
  alertHeaderModal: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_24,
    color: Colors.BLACK,
    marginVertical: 10,
    marginLeft: 8,
  },
  alertMessageModal: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_16,
    lineHeight: Typography.LINE_HEIGHT_24,
    color: Colors.BLACK,
  },
  bottomBtnContainerModal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  removeLabelModal: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.NEW_PRIMARY,
    lineHeight: Typography.LINE_HEIGHT_24,
  },
  primaryButtonStyleModal: {
    marginLeft: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  secondaryButtonStyleModal: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.DARK_TEXT
  },
})
