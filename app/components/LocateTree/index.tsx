import i18next from 'i18next';
import JailMonkey from 'jail-monkey';
import { useNavigation } from '@react-navigation/core';
import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Typography } from '../../styles';
import { deleteInventoryId } from '../../actions/inventory';
import { InventoryContext } from '../../reducers/inventory';
import { addLocateTree } from '../../repositories/inventory';
import { Header, LargeButton, PrimaryButton } from '../Common';
import { OFF_SITE, ON_SITE } from '../../utils/inventoryConstants';

const LocateTree = () => {
  const isRooted = JailMonkey.isJailBroken();

  const { state, dispatch } = useContext(InventoryContext);

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      deleteInventoryId()(dispatch);
    });
    return unsubscribe;
  }, [navigation]);

  const [locateTree, setLocateTree] = useState(ON_SITE);
  const [isSelectCoordinates, setIsSelectCoordinates] = useState(false);

  const onPressItem = (value: string) => {
    setIsSelectCoordinates(false);
    setLocateTree(value);
  };

  const onPressContinue = () => {
    let data = { inventory_id: state.inventoryID, locateTree };
    if (isSelectCoordinates) {
      data.locateTree = OFF_SITE;
      addLocateTree(data).then(() => {
        navigation.navigate('SelectCoordinates');
      });
    } else {
      navigation.navigate('CreatePolygon', { locateTree });
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.container}>
        <Header
          headingText={i18next.t('label.locate_tree_header')}
          testID={'btn_back'}
          accessibilityLabel={'Back'}
        />
        <ScrollView showsVerticalScrollIndicator={false}>
          <LargeButton
            disabled={isRooted}
            onPress={() => onPressItem(ON_SITE)}
            heading={i18next.t('label.locate_tree_heading')}
            subHeading={i18next.t('label.locate_tree_sub_heading')}
            active={locateTree == ON_SITE}
            subHeadingStyle={styles.subHeadingStyle}
            testID={'page_on_site_polygon'}
            accessibilityLabel={'On Site'}
          />
          <LargeButton
            onPress={() => onPressItem(OFF_SITE)}
            heading={i18next.t('label.locate_tree_off_site')}
            subHeading={i18next.t('label.locate_tree_off_site_sub_heading')}
            active={locateTree === OFF_SITE}
            subHeadingStyle={styles.subHeadingStyle}
            testID={'page_off_site_polygon'}
            accessibilityLabel={'Off Site Polygon'}
          />
        </ScrollView>
        {isRooted && <Text style={styles.addSpecies}>Device is rooted</Text>}
        <PrimaryButton
          onPress={onPressContinue}
          btnText={i18next.t('label.continue')}
          testID={'btn_continue'}
          accessibilityLabel={'Continue'}
        />
      </View>
    </SafeAreaView>
  );
};

export default LocateTree;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  addSpecies: {
    color: Colors.ALERT,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_30,
    textAlign: 'center',
  },
  subHeadingStyle: {
    fontStyle: 'italic',
  },
});
