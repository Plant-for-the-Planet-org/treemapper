import React from 'react';
import {
  View,
  Linking,
  StyleSheet,
  SafeAreaView,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../Common/Header';
import i18next from 'i18next';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography } from '_styles';
import { version } from '../../../package';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import { bugsnag } from '../../utils';

export default function Legals() {
  const navigation = useNavigation();

  const openWebView = async (link) => {
    try {
      const url = link;
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open(url, {
          // iOS Properties
          animated: true,
          modalPresentationStyle: 'fullScreen',
          enableBarCollapsing: true,
          // Android Properties
          enableUrlBarHiding: true,
          enableDefaultShare: true,
        });
      } else Linking.openURL(url);
    } catch (error) {
      console.error(error);
      bugsnag.notify(error);
      Alert.alert(error.message);
    }
  };
  const onPressImprint = () => {
    openWebView(`https://a.plant-for-the-planet.org/${i18next.language}/imprint`);
  };
  const onPressPolicy = () => {
    openWebView(`https://a.plant-for-the-planet.org/${i18next.language}/privacy-terms`);
  };
  const onPressTerms = () => {
    openWebView(`https://a.plant-for-the-planet.org/${i18next.language}/privacy-terms`);
  };
  const onPressOpenSource = () => {
    openWebView('https://github.com/Plant-for-the-Planet-org/treemapper/network/dependencies');
  };
  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.defaultSpacing}>
        <Header
          closeIcon
          headingText={i18next.t('label.legal_docs')}
          onBackPress={() => navigation.goBack()}
        />
      </View>
      <View style={styles.defaultSpacing}>
        <TouchableOpacity key="version" style={styles.touchable}>
          <View>
            <Text style={styles.itemText}>{version}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity key="privacy_policy" style={styles.touchable} onPress={onPressPolicy}>
          <View>
            <Text style={styles.itemText}>{i18next.t('label.privacy_policy')}</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} />
        </TouchableOpacity>
        <TouchableOpacity key="imprint" style={styles.touchable} onPress={onPressImprint}>
          <View>
            <Text style={styles.itemText}>{i18next.t('label.imprint')}</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} />
        </TouchableOpacity>
        <TouchableOpacity key="terms_of_service" style={styles.touchable} onPress={onPressTerms}>
          <View>
            <Text style={styles.itemText}>{i18next.t('label.terms_of_service')}</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          key="open_source_license"
          style={styles.touchable}
          onPress={onPressOpenSource}>
          <View>
            <Text style={styles.itemText}>{i18next.t('label.open_source_license')}</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  defaultSpacing: {
    paddingHorizontal: 25,
    paddingTop: 10,
  },
  touchable: {
    paddingVertical: 20,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderColor: '#E1E0E061',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemText: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_24,
    color: Colors.TEXT_COLOR,
  },
});
