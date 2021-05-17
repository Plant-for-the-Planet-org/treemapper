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
import { APIConfig } from '../../actions/Config';

const { protocol, cdnUrl } = APIConfig;

const SampleTreeListItem = ({ sampleTree, totalSampleTrees, index, navigation, countryCode }) => {
  const imageURIPrefix = Platform.OS === 'android' ? 'file://' : '';
  let imageSource = sampleTree.imageUrl
    ? { uri: `${imageURIPrefix}${RNFS.DocumentDirectoryPath}/${sampleTree.imageUrl}` }
    : sampleTree.cdnImageUrl
      ? {
        // uri: `https://bucketeer-894cef84-0684-47b5-a5e7-917b8655836a.s3.eu-west-1.amazonaws.com/development/media/cache/coordinate/thumb/${sampleTree.cdnImageUrl}`,
        uri: `${protocol}://${cdnUrl}/media/cache/coordinate/thumb/${sampleTree.cdnImageUrl}`,
      }
      : single_tree_png;

  const specieHeight = nonISUCountries.includes(countryCode)
    ? sampleTree.specieHeight * meterToFoot
    : sampleTree.specieHeight;
  const specieDiameter = nonISUCountries.includes(countryCode)
    ? sampleTree.specieDiameter * cmToInch
    : sampleTree.specieDiameter;

  const heightUnit = nonISUCountries.includes(countryCode)
    ? i18next.t('label.select_species_feet')
    : 'm';
  const diameterUnit = nonISUCountries.includes(countryCode)
    ? i18next.t('label.select_species_inches')
    : 'cm';

  return (
    <TouchableOpacity
      onPress={() => {
        console.log(totalSampleTrees, 'totalSampleTrees');
        navigation.navigate('SingleTreeOverview', {
          isSampleTree: true,
          sampleTreeIndex: index,
          totalSampleTrees,
        });
      }}>
      <View style={styles.specieListItemContainer}>
        <Image source={imageSource} style={styles.image} resizeMode={'stretch'} />
        <View style={styles.specieListTextContainer}>
          <Text style={styles.specieListHeading}>
            {`${sampleTree.specieName}${sampleTree.tagId ? ' • ' + sampleTree.tagId : ''}`}
          </Text>
          <Text style={styles.subHeadingText}>
            #{index + 1} • {Math.round(specieHeight * 100) / 100} {heightUnit} •{' '}
            {Math.round(specieDiameter * 100) / 100} {diameterUnit}
          </Text>
        </View>
        <FAIcon name="angle-right" size={30} color={Colors.GRAY_DARK} />
      </View>
    </TouchableOpacity>
  );
};

export default function SampleTreesReview({ sampleTrees, totalSampleTrees, navigation }) {
  const [countryCode, setCountryCode] = useState('');

  useEffect(() => {
    getUserInformation().then((data) => {
      setCountryCode(data.country);
    });
  }, []);
  return (
    <View style={{ marginBottom: 24 }}>
      <Label leftText={i18next.t('label.sample_trees')} rightText={''} />
      <FlatList
        data={sampleTrees}
        renderItem={({ item: sampleTree, index }) => {
          return (
            <SampleTreeListItem
              sampleTree={sampleTree}
              totalSampleTrees={totalSampleTrees}
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
    marginHorizontal: 16,
    flex: 1,
  },
  specieListHeading: {
    fontSize: Typography.FONT_SIZE_16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginBottom: 6,
  },
  subHeadingText: {
    fontSize: Typography.FONT_SIZE_14,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
  },
  image: {
    height: 60,
    width: 60,
    borderRadius: 2,
  },
});
