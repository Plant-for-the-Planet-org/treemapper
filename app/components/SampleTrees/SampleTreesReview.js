import React from 'react';
import { View, Text, FlatList } from 'react-native';
import Label from '../Common/Label';
import i18next from '18next';

const SampleTreeListItem = (sampleTree) => {
  return (
    <View>
      <Text>Sample tree list titem</Text>
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
          let normalizeData = {
            title: sampleTree.specieName,
            subHeading: `${index + 1} . ${sampleTree.specieName} . ${sampleTree.specieHeight} . ${
              sampleTree.specieDiameter
            }`,
            date: i18next.t('label.inventory_overview_view_location'),
            imageURL: '',
            index: index,
          };
          return (
            <SampleTreeListItem sampleTree />
          );
        }}
        keyExtractor={(item, index) => `location-${index}`}
      />
    </View>
  );
}
