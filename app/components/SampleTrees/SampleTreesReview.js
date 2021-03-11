import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Label from '../Common/Label';
import i18next from 'i18next';
import { Typography } from '_styles';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import { Colors } from '_styles';

const SampleTreeListItem = ({ sampleTree, index }) => {
  return (
    <View style={styles.specieListItemContainer}>
      <View style={styles.specieListTextContainer}>
        <View style={styles.specieHeadingContainer}>
          <Text style={styles.specieListHeading}>{sampleTree.specieName}</Text>
          <Text style={styles.specieListHeading}>
            {sampleTree.tagId ? ' • ' + sampleTree.tagId : ''}
          </Text>
        </View>
        <Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAY_LIGHT,
  },
  specieListTextContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  specieHeadingContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  specieListHeading: {
    fontSize: Typography.FONT_SIZE_16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
  },
});
