import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Header } from '../Common';
import { SafeAreaView } from 'react-native';
import { Colors } from '_styles';
import i18next from 'i18next';

const ManageUsers = () => {
  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.container}>
        <Header
          headingText={i18next.t('label.manage_user_header')}
          subHeadingText={i18next.t('label.manage_user_sub_header')}
        />
        <View style={styles.cont}></View>
      </View>
    </SafeAreaView>
  );
};
export default ManageUsers;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  cont: {
    flex: 1,
  },
});
