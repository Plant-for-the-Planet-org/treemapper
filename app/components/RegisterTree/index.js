import React, { useState, useContext } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Header, LargeButton, PrimaryButton } from '../Common';
import { SafeAreaView } from 'react-native';
import { InventoryContext } from '../../reducers/inventory';
import { Colors } from '_styles';
import i18next from 'i18next';
import { deleteInventoryId } from '../../actions/inventory';
import { MULTI, SINGLE } from '../../utils/inventoryConstants';

const RegisterTree = ({ navigation }) => {
  const { dispatch } = useContext(InventoryContext);

  const [treeType, setTreeType] = useState(MULTI);

  const onPressSingleTree = () => setTreeType(SINGLE);
  const onPressMultipleTree = () => setTreeType(MULTI);

  const onPressContinue = async () => {
    deleteInventoryId()(dispatch);

    if (treeType === MULTI) {
      navigation.navigate('LocateTree');
    } else {
      navigation.navigate('RegisterSingleTree');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <View style={styles.container}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <Header
            headingText={i18next.t('label.register_trees')}
            subHeadingText={i18next.t('label.register_trees_description')}
          />
          <LargeButton
            onPress={onPressSingleTree}
            heading={i18next.t('label.tree_registration_type_1')}
            subHeading={i18next.t('label.tree_registration_type_1_sub_header')}
            active={treeType === SINGLE}
            subHeadingStyle={treeType === SINGLE && styles.activeTextColor}
            testID={'page_rt_single_tree'}
            accessibilityLabel={'Single Tree'}
          />
          <LargeButton
            onPress={onPressMultipleTree}
            heading={i18next.t('label.tree_registration_type_2')}
            subHeading={`${i18next.t('label.tree_registration_type_1_sub_header')}`}
            active={treeType === MULTI}
            subHeadingStyle={treeType === MULTI && styles.activeTextColor}
            testID={'page_rt_multiple_trees'}
            accessibilityLabel={'Multiple Trees'}
          />
          <View style={{ flex: 1 }}></View>
        </ScrollView>
        <PrimaryButton
          onPress={onPressContinue}
          btnText={i18next.t('label.continue')}
          theme={'primary'}
          testID={'btn_rt_continue'}
          accessibilityLabel={'Continue'}
        />
      </View>
    </SafeAreaView>
  );
};
export default RegisterTree;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
  },
  activeTextColor: {
    color: Colors.PRIMARY,
  },
});
