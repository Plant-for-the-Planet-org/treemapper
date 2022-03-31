import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import i18next from 'i18next';
import { Colors, Typography } from '../../../styles';

type Props = {
  visible: boolean;
  closeModal: () => void;
};

const colorCodes = [
  {
    textColor: '#87B738',
    label: 'label.green',
    text: 'label.green_info',
  },
  {
    textColor: '#CBBB03',
    label: 'label.yellow',
    text: 'label.yello_info',
  },
  {
    textColor: '#FF0000',
    label: 'label.red',
    text: 'label.red_info',
  },
];

const AccuracyModal = ({ visible, closeModal }: Props) => {
  return (
    <Modal transparent visible={visible}>
      <View style={styles.modalContainer}>
        <View style={styles.contentContainer}>
          <Text
            style={{
              color: '#000000',
              fontFamily: Typography.FONT_FAMILY_BOLD,
              fontSize: Typography.FONT_SIZE_18,
              paddingBottom: 18,
            }}>
            {i18next.t('label.gps_accuracy')}
          </Text>
          <Text style={[styles.accuracyModalText, { marginBottom: 16 }]}>
            {i18next.t('label.accuracy_info')}
          </Text>
          {colorCodes.map(color => (
            <Text style={styles.accuracyModalText}>
              <Text style={{ color: color.textColor, fontFamily: Typography.FONT_FAMILY_BOLD }}>
                {i18next.t(color.label)}
              </Text>{' '}
              {i18next.t(color.text)}
            </Text>
          ))}
          <TouchableOpacity
            style={{
              alignSelf: 'center',
              paddingTop: 25,
            }}>
            <Text
              style={{
                color: '#87B738',
                fontFamily: Typography.FONT_FAMILY_REGULAR,
                fontSize: Typography.FONT_SIZE_14,
              }}
              onPress={() => closeModal()}>
              {i18next.t('label.close')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AccuracyModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  contentContainer: {
    backgroundColor: Colors.WHITE,
    width: 300,
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderRadius: 10,
    paddingLeft: 25,
    paddingRight: 15,
    paddingVertical: 25,
  },
  accuracyModalText: {
    color: '#000000',
    lineHeight: Typography.LINE_HEIGHT_20,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
  },
});
