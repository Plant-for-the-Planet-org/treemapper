import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Colors, Typography } from '_styles';
import { useRoute } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import { mobile_download, cloud_sync } from '../../assets';
import i18next from 'i18next';

export default function InitialLoading() {
  const route = useRoute();

  const textMessage =
    route.name === 'SpeciesLoading'
      ? i18next.t('label:updating_species')
      : i18next.t('label:updating_database');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageContainer}>
        <SvgXml xml={route.name === 'SpeciesLoading' ? mobile_download : cloud_sync} />
      </View>
      <Text style={styles.textStyle}>{textMessage}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  imageContainer: {
    width: '90%',
    height: '50%',
  },
  textStyle: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_30,
    lineHeight: Typography.LINE_HEIGHT_30,
    color: Colors.TEXT_COLOR,
    padding: 10,
  },
});
