import React from 'react';
import { View, Text, Modal, StyleSheet, ActivityIndicator } from 'react-native';

const Loader = ({isLoaderShow}) => {
  return (
    <Modal transparent visible={isLoaderShow}>
      <View style={styles.dowloadModalContainer}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#89B53A" />
          <Text style={{ padding: 30, borderRadius: 10 }}>
            Please Wait.....
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