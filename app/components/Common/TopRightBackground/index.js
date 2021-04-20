import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { top_right_tree } from '../../../assets';

export default function TopRightBackground() {
  return (
    <View style={styles.backgroundImageView}>
      <ImageBackground source={top_right_tree} style={{}}>
        <View style={styles.innerView}></View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImageView: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 360,
    height: 100,
  },
  innerView: {
    height: 130,
  },
});
