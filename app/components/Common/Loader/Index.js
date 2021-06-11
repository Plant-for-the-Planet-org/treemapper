import React from 'react';
import i18next from 'i18next';
import { View, Text, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '_styles';

export default function Loader({ isLoaderShow }) {
  return (
    <Modal transparent visible={isLoaderShow}>
      <View style={styles.downloadModalContainer}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
          <Text style={{ padding: 30, borderRadius: 10 }}>{i18next.t('label.please_wait')}</Text>
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
});
