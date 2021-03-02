import i18next from 'i18next';
import React, { useContext, useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Typography } from '_styles';
import { sample_trees_vector } from '../../assets';
import { InventoryContext } from '../../reducers/inventory';
import { updateInventory } from '../../repositories/inventory';
import { Header, PrimaryButton } from '../Common';

/**
 * Maps/Shows the button to select the sample tree count which user is going to add
 * @prop @param sampleTreesCount - array of tree count to map/show on UI
 * @prop @param selectedTreeCount - count of tree for selected option
 */
const TreeNumberSelection = ({ sampleTreesCount, selectedTreeCount, setSelectedTreeCount }) => {
  return (
    <View style={styles.treeCountSelectionContainer}>
      {/* if sample tree count is present and has length greater than zero then maps the array */}
      {sampleTreesCount &&
        sampleTreesCount.length > 0 &&
        sampleTreesCount.map((treeCount) => {
          // used to show the selected tree count selected by user
          const isSelected = treeCount === selectedTreeCount;
          return (
            <TouchableOpacity onPress={() => setSelectedTreeCount(treeCount)}>
              <View
                style={[
                  styles.treeCountSelection,
                  isSelected ? styles.treeCountSelectionActive : {},
                ]}>
                <Text
                  style={[
                    styles.treeCountSelectionText,
                    isSelected ? styles.treeCountSelectionActiveText : {},
                  ]}>
                  {treeCount + '\n'}{' '}
                  {treeCount === 1 ? i18next.t('label.tree') : i18next.t('label.trees')}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
    </View>
  );
};

// shows the sample tree initial screen where user selects the number of sample trees to record.
export default function SampleTreesCount() {
  // used to show the tree count selection option with values of array as number oftrees to select
  const sampleTreesCount = [2, 5, 10];

  // used to set the selected tree count
  const [selectedTreeCount, setSelectedTreeCount] = useState(5);

  // gets the inventory state to get the inventory id selected currently
  const { state } = useContext(InventoryContext);

  // sets the sample tree count in the inventory schema and the navigates to map marking of sample trees
  const onPressContinue = () => {
    updateInventory({
      inventory_id: state.inventoryID,
      inventoryData: {
        sampleTreesCount: selectedTreeCount,
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <View style={styles.container}>
        <Image source={sample_trees_vector} style={styles.backgroundImage} />
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <Header headingText={i18next.t('label.sample_trees')} />

          {/* container for description of what sample trees are and how to proceed */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              {i18next.t('label.next_step_to_measure_sample_trees_text')}
            </Text>
            <Text style={[styles.description, styles.descriptionMarginTop]}>
              {i18next.t('label.recommend_at_least_sample_trees')}
            </Text>
            <Text
              style={[
                styles.description,
                styles.descriptionMarginTop,
                { fontFamily: Typography.FONT_FAMILY_BOLD },
              ]}>
              {i18next.t('label.how_many_sample_trees_to_record')}
            </Text>
          </View>

          {/* container for sample tree count selection options */}
          <TreeNumberSelection
            sampleTreesCount={sampleTreesCount}
            selectedTreeCount={selectedTreeCount}
            setSelectedTreeCount={setSelectedTreeCount}
          />
        </ScrollView>
        <PrimaryButton
          onPress={onPressContinue}
          btnText={i18next.t('label.continue')}
          theme={'primary'}
          testID={'sample_tree_count_continue'}
          accessibilityLabel={'sample_tree_count_continue'}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
    position: 'relative',
  },
  backgroundImage: {
    width: '90%',
    height: 40,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  descriptionContainer: {
    marginTop: 40,
  },
  description: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    color: Colors.TEXT_COLOR,
  },
  descriptionMarginTop: {
    marginTop: 20,
  },
  treeCountSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginTop: 30,
  },
  treeCountSelection: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.LIGHT_BORDER_COLOR,
    padding: 10,
    minWidth: '28%',
  },
  treeCountSelectionActive: {
    borderWidth: 0,
    padding: 11,
    backgroundColor: Colors.PRIMARY,
  },
  treeCountSelectionText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_16,
    textAlign: 'center',
  },
  treeCountSelectionActiveText: {
    color: Colors.WHITE,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
});
