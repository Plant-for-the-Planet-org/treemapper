import React from 'react';
import { View, Text, FlatList, StyleSheet, Platform, Image } from 'react-native';
import Label from '../Common/Label';
import i18next from 'i18next';
import { Typography } from '_styles';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import { Colors } from '_styles';
import { single_tree_png } from '../../assets';
import RNFS from 'react-native-fs';

const SampleTreeListItem = ({ sampleTree, index }) => {
  const imageURIPrefix = Platform.OS === 'android' ? 'file://' : '';
  let imageSource = sampleTree.imageUrl
    ? { uri: `${imageURIPrefix}${RNFS.DocumentDirectoryPath}/${sampleTree.imageUrl}` }
    : single_tree_png;

  return (
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
          #{index + 1} • {sampleTree.specieHeight}cm • {sampleTree.specieDiameter}cm
        </Text>
      </View>
      <FAIcon name="angle-right" size={30} color={Colors.GRAY_DARK} />
    </View>
  );
};

export default function SampleTreesReview({ sampleTrees }) {
  return (
    <View>
      <Label leftText={i18next.t('label.sample_trees')} rightText={''} />
      <FlatList
        data={sampleTrees}
        renderItem={({ item: sampleTree, index }) => {
          return <SampleTreeListItem sampleTree={sampleTree} index={index} />;
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
