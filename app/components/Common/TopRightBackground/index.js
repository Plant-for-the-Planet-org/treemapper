import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { top_right_tree } from '../../../assets';

export default function TopRightBackground() {
  return (
    <ImageBackground id={'inventorybtn'} source={top_right_tree} style={styles.backgroundImage}>
      <View style={styles.backgroundImageView}></View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 20,
  },
  backgroundImageView: {
    height: 140,
  },
});
