import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import React from 'react'
import Modal from 'react-native-modal'
import {Colors, Typography} from 'src/utils/constants'
import PinkHeart from 'assets/images/svg/PinkHeart.svg'
import i18next from 'i18next'
import FlatButton from '../common/FlatButton'

interface Props {
  isVisible: boolean
  toogleModal: () => void
  removeFavSpecie: () => void
}

const RemoveSpeciesModal = (props: Props) => {
  const {isVisible, toogleModal, removeFavSpecie} = props
  return (
    <Modal
      style={styles.container}
      isVisible={isVisible}
      onBackdropPress={toogleModal}>
      <View style={styles.subContainer}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <PinkHeart />
          <Text style={styles.alertHeader}>
            {i18next.t('label.remove_species')}
          </Text>
        </View>
        <Text style={styles.alertMessage}>
          {i18next.t('label.sure_remove_species')}
        </Text>
        <View style={styles.bottomBtnContainer}>
          <FlatButton
            onPress={toogleModal}
            text={i18next.t('label.cancel')}
            style={styles.secondaryButtonStyle}
          />
          <TouchableOpacity
            onPress={removeFavSpecie}
            style={styles.primaryButtonStyle}>
            <Text style={styles.removeLable}>{i18next.t('label.remove')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

export default RemoveSpeciesModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contnetWrapper: {
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
    fontSize: Typography.FONT_SIZE_16,
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
  removeLable: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    lineHeight: Typography.LINE_HEIGHT_24,
  },
  primaryButtonStyle: {
    marginLeft: 16,
    color: Colors.ALERT,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  secondaryButtonStyle: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
})
