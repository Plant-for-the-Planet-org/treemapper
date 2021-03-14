import i18next from 'i18next';
import JailMonkey from 'jail-monkey';
import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Colors, Typography } from '_styles';
import { cloud_upload_gray } from '../../assets';
import { InventoryContext } from '../../reducers/inventory';
import { deleteInventoryId } from '../../actions/inventory';
import { addLocateTree, updateLastScreen } from '../../repositories/inventory';
import { OFF_SITE, ON_SITE } from '../../utils/inventoryConstants';
import { Header, LargeButton, PrimaryButton } from '../Common';

const LocateTree = ({ navigation }) => {
  const isRooted = JailMonkey.isJailBroken();

  const { state, dispatch } = useContext(InventoryContext);

  useEffect(() => {
    deleteInventoryId()(dispatch);
  }, []);

  const [locateTree, setLocateTree] = useState(ON_SITE);
  const [isSelectCoordinates, setIsSelectCoordinates] = useState(false);

  const onPressItem = (value) => {
    setIsSelectCoordinates(false);
    setLocateTree(value);
  };

  const onPressContinue = () => {
    let data = { inventory_id: state.inventoryID, locate_tree: locateTree };
    if (isSelectCoordinates) {
      data.locate_tree = OFF_SITE;
      addLocateTree(data).then(() => {
        navigation.navigate('SelectCoordinates');
      });
    } else {
      navigation.navigate('CreatePolygon', { locateTree });
    }
  };

  const onPressSelectCoordinates = async () => {
    onPressItem('');
    setIsSelectCoordinates(true);
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
            subHeadingStyle={{ fontStyle: 'italic' }}
            testID={'page_on_site_polygon'}
            accessibilityLabel={'On Site'}
          />
          <LargeButton
            onPress={() => onPressItem(OFF_SITE)}
            heading={i18next.t('label.locate_tree_off_site')}
            subHeading={i18next.t('label.locate_tree_off_site_sub_heading')}
            active={locateTree === OFF_SITE}
            subHeadingStyle={{ fontStyle: 'italic' }}
            testID={'page_off_site_polygon'}
            accessibilityLabel={'Off Site Polygon'}
          />
          <LargeButton
            onPress={onPressSelectCoordinates}
            heading={i18next.t('label.locate_tree_off_site_point_heading')}
            subHeading={i18next.t('label.locate_tree_off_site_point_sub_heading')}
            active={isSelectCoordinates}
            subHeadingStyle={{ fontStyle: 'italic' }}
            testID={'page_off_site_point'}
            accessibilityLabel={'Off Site Point'}
          />
          <LargeButton
            onPress={onPressSelectCoordinates}
            heading={i18next.t('label.locate_tree_geo_json')}
            subHeadingStyle={{ fontStyle: 'italic' }}
            rightIcon={<SvgXml xml={cloud_upload_gray} />}
            disabled
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
  cont: {
    flex: 1,
  },
  addSpecies: {
    color: Colors.ALERT,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_30,
    textAlign: 'center',
  },
});
