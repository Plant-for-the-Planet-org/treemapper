import React from 'react';
import { View, StyleSheet } from 'react-native';
import BackButton from '../../../components/backButton/BackButton';

export function CreateProjectUI() {
  return (
    <View style={styles.container}>
      <BackButton label="Create new project" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff', // optional default background
  },
});

export default CreateProjectUI;
