import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { Colors, Typography } from '_styles';
import FlatButton from '../FlatButton';

const AlertModal = ({
  visible,
  heading,
  message,
  primaryBtnText,
  secondaryBtnText,
  onPressPrimaryBtn,
  onPressSecondaryBtn,
}) => {
  return (
    <Modal visible={visible} transparent>
      <View style={styles.container}>
        <View style={styles.subContainer}>
          <Text style={styles.alertHeader}>{heading}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
          <View style={styles.bottomBtnContainer}>
            <FlatButton onPress={onPressSecondaryBtn} text={secondaryBtnText} />
            <FlatButton
              onPress={onPressPrimaryBtn}
              text={primaryBtnText}
              style={styles.marginHorizontal}
              primary
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    marginVertical: 5,
  },
  marginHorizontal: {
    marginHorizontal: 20,
  },
});

export default AlertModal;
