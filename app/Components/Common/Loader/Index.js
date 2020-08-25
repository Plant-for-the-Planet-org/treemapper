import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';

const Loader = ({isLoaderShow}) => {
  return (
    <Modal transparent visible={isLoaderShow}>
      <View style={styles.dowloadModalContainer}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ padding: 30, backgroundColor: '#fff', borderRadius: 10 }}>
              Uploading..........
          </Text>
        </View>
      </View>
    </Modal>
  );
};
export default Loader;

const styles = StyleSheet.create({
  dowloadModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});