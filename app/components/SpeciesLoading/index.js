import React from 'react';
import { Text, StyleSheet, SafeAreaView } from 'react-native';
import { Colors, Typography } from '_styles';

export default function SpeciesLoading() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.textStyle}>Updating species...</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textStyle: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_30,
    lineHeight: Typography.LINE_HEIGHT_30,
    color: Colors.TEXT_COLOR,
  },
});
