import i18next from 'i18next';
import React from 'react';
import { View, Text, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Typography } from '../../../styles';

interface ILoaderProps {
  isLoaderShow: boolean;
  loadingText?: string;
}

export default function Loader({ isLoaderShow, loadingText }: ILoaderProps) {
  return (
    <Modal transparent visible={isLoaderShow}>
      <View style={styles.downloadModalContainer}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
          <Text style={styles.text}>{loadingText || i18next.t('label.loading_content')}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  downloadModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  text: {
    padding: 30,
    borderRadius: 10,
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
  },
});
