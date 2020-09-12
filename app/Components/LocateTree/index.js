import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Modal } from 'react-native';
import { Header, LargeButton, PrimaryButton, Alrighty } from '../Common';
import { SafeAreaView } from 'react-native';
import { cloud_upload_gray } from '../../assets';
import { Colors, Typography } from '_styles';
import { addLocateTree, updateLastScreen } from '../../Actions';
import { store } from '../../Actions/store';
import JailMonkey from 'jail-monkey';
import { SvgXml } from 'react-native-svg';
import i18next from 'i18next';

const LocateTree = ({ navigation }) => {
  const isRooted = JailMonkey.isJailBroken();

  const { state } = useContext(store);

  useEffect(() => {
    let data = { inventory_id: state.inventoryID, last_screen: 'LocateTree' };
    updateLastScreen(data);
  }, []);

  const [locateTree, setLocateTree] = useState('on-site');
  const [isSelectCoordinates, setIsSelectCoordinates] = useState(false);

  const onPressItem = (value) => {
    setIsSelectCoordinates(false);
    setLocateTree(value);
  };

  const onPressContinue = () => {
    let data = { inventory_id: state.inventoryID, locate_tree: locateTree };
    if (isSelectCoordinates) {
      data.locate_tree = 'off-site';
      addLocateTree(data).then(() => {
        navigation.navigate('SelectCoordinates');
        setIsAlrightyModalShow(false);
      });
      return;
    }
    addLocateTree(data).then(() => {
      navigation.navigate('CreatePolygon');
      setIsAlrightyModalShow(false);
    });
  };

  const onPressClose = () => {
    setIsAlrightyModalShow(false);
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
            onPress={() => onPressItem('on-site')}
            heading={i18next.t('label.locate_tree_heading')}
            subHeading={i18next.t('label.locate_tree_sub_heading')}
            active={locateTree == 'on-site'}
            subHeadingStyle={{ fontStyle: 'italic' }}
            testID={'page_on_site_polygon'}
            accessibilityLabel={'On Site'}
          />
          <LargeButton
            onPress={() => onPressItem('off-site')}
            heading={i18next.t('label.locate_tree_off_site')}
            subHeading={i18next.t('label.locate_tree_off_site_sub_heading')}
            active={locateTree == 'off-site'}
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
