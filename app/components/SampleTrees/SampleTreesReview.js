import React from 'react';
import { View, Text, FlatList } from 'react-native';

const SampleTreeListItem = (sampleTree) => {
  return <div></div>;
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
            <InventoryCard
              data={normalizeData}
              activeBtn={inventory.status === 'complete'}
              onPressActiveBtn={onPressViewLOC}
              hideImage
            />
          );
        }}
        keyExtractor={(item, index) => `location-${index}`}
      />
    </View>
  );
}
