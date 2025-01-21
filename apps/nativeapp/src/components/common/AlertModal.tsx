import React, {memo} from 'react'
import {View, Text, StyleSheet} from 'react-native'
import Modal from 'react-native-modal'
import FlatButton from './FlatButton'
import {Colors, Typography} from 'src/utils/constants'

interface IAlertModalProps {
  visible: boolean
  heading: string
  message?: string
  primaryBtnText: string
  onPressPrimaryBtn: any
  showSecondaryButton?: boolean
  secondaryBtnText?: string
  onPressSecondaryBtn?: any
}

const AlertModal = ({
  visible,
  heading,
  message,
  primaryBtnText,
  onPressPrimaryBtn,
  showSecondaryButton = true,
  secondaryBtnText,
  onPressSecondaryBtn,
}: IAlertModalProps) => {
  const closeModal=()=>{
    onPressSecondaryBtn(false)
  }
  const goNext=()=>{
    onPressPrimaryBtn(true)
  }
  return (
    <Modal isVisible={visible} style={styles.container}>
      <View style={styles.subContainer}>
        <Text style={styles.alertHeader}>{heading}</Text>
        <Text style={styles.alertMessage}>{message}</Text>
        <View style={styles.bottomBtnContainer}>
          {showSecondaryButton && (
            <FlatButton
              onPress={closeModal}
              text={secondaryBtnText}
              style={styles.secondaryButtonStyle}
            />
          )}
          <FlatButton
            onPress={goNext}
            text={primaryBtnText}
            style={styles.primaryButtonStyle}
          />
        </View>
      </View>
    </Modal>
  )
}

export default memo(AlertModal, (prevProps, nextProps) => {
  if (prevProps.visible === nextProps.visible) {
    return true // props are equal
  }
  return false // props are not equal -> update the component
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  subContainer: {
    width: '90%',
    backgroundColor: Colors.WHITE,
    borderRadius: 10,
    padding: 20,
  },
  bottomBtnContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  alertHeader: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_22,
    lineHeight: Typography.LINE_HEIGHT_24,
    color: Colors.BLACK,
    marginVertical: 10,
  },
  alertMessage: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_16,
    lineHeight: Typography.LINE_HEIGHT_24,
    color: Colors.BLACK,
  },
  primaryButtonStyle: {
    marginLeft: 20,
    color: Colors.ALERT,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  secondaryButtonStyle: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
})
