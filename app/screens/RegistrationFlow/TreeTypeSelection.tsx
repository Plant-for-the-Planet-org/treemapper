import { useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useContext, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { deleteInventoryId } from '../../actions/inventory';
import { multipleTreesIcon, singleTreeIcon } from '../../assets';
import { InventoryContext } from '../../reducers/inventory';
import { Colors } from '../../styles';
import { Header, LargeButton } from '../../components/Common';
import { TreeType } from '../../utils/inventoryConstants';
import { useDispatch } from 'react-redux';
import { setTreeType } from '../../redux/registrationSlice';

type Props = {};

/**
 * Shows single tree and multiple buttons for tree type selection to the user
 * and accordingly navigates to the next screen.
 */
export default function TreeTypeSelection({}: Props) {
  const { dispatch: inventoryDispatch } = useContext(InventoryContext);

  const dispatch = useDispatch();

  const navigation = useNavigation();

  const screenToTreeTypeMapping = {
    MultipleTreeMarkerMap: TreeType.MULTIPLE,
    SingleTreeMarkerMap: TreeType.SINGLE,
  };

  // removes the treeType from registration state
  useEffect(() => {
    dispatch(setTreeType(''));
  }, []);

  /**
   * Deletes the inventory id from the global state and navigates to the passed screen name
   * @param screenName - The name of the screen to navigate to. It can be either 'MultipleTreeMarkerMap' or 'SingleTreeMarkerMap'
   */
  const continueToNextScreen = (screenName: 'MultipleTreeMarkerMap' | 'SingleTreeMarkerMap') => {
    deleteInventoryId()(inventoryDispatch);
    dispatch(setTreeType(screenToTreeTypeMapping[screenName]));

    navigation.navigate(screenName);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <View style={styles.container}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <Header
            headingText={i18next.t('label.register_trees')}
            subHeadingText={i18next.t('label.register_trees_description')}
          />

          {/* shows the button for single tree and multiple tree selection */}
          <LargeButton
            onPress={() => continueToNextScreen('SingleTreeMarkerMap')}
            heading={i18next.t('label.tree_registration_type_1')}
            subHeading={i18next.t('label.tree_registration_type_1_sub_header')}
            testID={'page_rt_single_tree'}
            accessibilityLabel={'Single Tree'}
            leftComponent={
              <View style={styles.icon}>
                <SvgXml xml={singleTreeIcon} />
              </View>
            }
          />
          <LargeButton
            onPress={() => continueToNextScreen('MultipleTreeMarkerMap')}
            heading={i18next.t('label.tree_registration_type_2')}
            subHeading={`${i18next.t('label.tree_registration_type_1_sub_header')}`}
            testID={'page_rt_multiple_trees'}
            accessibilityLabel={'Multiple Trees'}
            leftComponent={
              <View style={styles.icon}>
                <SvgXml xml={multipleTreesIcon} />
              </View>
            }
          />
          <View style={{ flex: 1 }}></View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
} // end TreeTypeSelection

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
  },
  icon: { height: 64, width: 64, marginLeft: 4 },
});
