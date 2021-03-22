import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RNFS from 'react-native-fs';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import { Colors, Typography } from '_styles';
import { single_tree_png } from '../../assets';
import { cmToInch, meterToFoot, nonISUCountries } from '../../utils/constants';
import Label from '../Common/Label';
import { getUserInformation } from '../../repositories/user';

const SampleTreeListItem = ({ sampleTree, index, navigation, countryCode }) => {
  const imageURIPrefix = Platform.OS === 'android' ? 'file://' : '';
  let imageSource = sampleTree.imageUrl
    ? { uri: `${imageURIPrefix}${RNFS.DocumentDirectoryPath}/${sampleTree.imageUrl}` }
    : single_tree_png;

  const specieHeight = nonISUCountries.includes(countryCode)
    ? sampleTree.specieHeight * meterToFoot
    : sampleTree.specieHeight;
  const specieDiameter = nonISUCountries.includes(countryCode)
    ? sampleTree.specieDiameter * cmToInch
    : sampleTree.specieDiameter;

  console.log('specieHeight', specieHeight);
  console.log('specieDiameter', specieDiameter);

  const heightUnit = nonISUCountries.includes(countryCode) ? 'foot' : 'm';
  const diameterUnit = nonISUCountries.includes(countryCode) ? 'inch' : 'cm';

  return (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('SingleTreeOverview', { isSampleTree: true, sampleTreeIndex: index })
      }>
      <View style={styles.specieListItemContainer}>
        <Image source={imageSource} style={styles.image} resizeMode={'stretch'} />
        <View style={styles.specieListTextContainer}>
          <View style={styles.specieHeadingContainer}>
            <Text style={styles.specieListHeading}>{sampleTree.specieName}</Text>
            <Text style={styles.specieListHeading}>
              {sampleTree.tagId ? ' • ' + sampleTree.tagId : ''}
            </Text>
          </View>
          <Text style={styles.subHeadingText}>
            #{index + 1} • {specieHeight} {heightUnit} • {specieDiameter} {diameterUnit}
          </Text>
        </View>
        <FAIcon name="angle-right" size={30} color={Colors.GRAY_DARK} />
      </View>
    </TouchableOpacity>
  );
};

export default function SampleTreesReview({ sampleTrees, navigation }) {
  const [countryCode, setCountryCode] = useState('');

  useEffect(() => {
    getUserInformation().then((data) => {
      setCountryCode(data.country);
    });
  }, []);
  return (
    <View>
      <Label leftText={i18next.t('label.sample_trees')} rightText={''} />
      <FlatList
        data={sampleTrees}
        renderItem={({ item: sampleTree, index }) => {
          return (
            <SampleTreeListItem
              sampleTree={sampleTree}
              index={index}
              navigation={navigation}
              countryCode={countryCode}
            />
          );
        }}
        keyExtractor={(item, index) => `location-${index}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  specieListItemContainer: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAY_LIGHT,
  },
  specieListTextContainer: {
    justifyContent: 'center',
    marginRight: 'auto',
    marginLeft: 16,
  },
  specieHeadingContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  specieListHeading: {
    fontSize: Typography.FONT_SIZE_16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
  },
  subHeadingText: {
    fontSize: Typography.FONT_SIZE_14,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
  },
  image: {
    height: 60,
    width: 60,
    borderRadius: 8,
  },
});
