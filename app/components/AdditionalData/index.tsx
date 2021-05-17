import { useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SceneMap, TabView } from 'react-native-tab-view';
import { Colors, Typography } from '_styles';
import CustomTabBar from '../Common/CustomTabBar';
import Header from '../Common/Header';
import Form from './Form';
import Metadata from './Metadata';

export default function AdditionalData() {
  const [routeIndex, setRouteIndex] = React.useState(0);
  const [tabRoutes] = React.useState([
    { key: 'form', title: i18next.t('label.additional_data_form') },
    { key: 'metadata', title: i18next.t('label.additional_data_metadata') },
  ]);
  const layout = useWindowDimensions();
  const navigation = useNavigation();

  const renderScene = SceneMap({
    form: Form,
    metadata: Metadata,
  });
  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={{ flex: 1 }}>
        <View style={styles.defaultSpacing}>
          <Header
            closeIcon
            headingText={i18next.t('label.additional_data')}
            onBackPress={() => navigation.goBack()}
          />
        </View>
        <TabView
          navigationState={{ index: routeIndex, routes: tabRoutes }}
          renderScene={renderScene}
          onIndexChange={setRouteIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={(props) => (
            <CustomTabBar {...props} tabRoutes={tabRoutes} setRouteIndex={setRouteIndex} />
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  defaultSpacing: {
    paddingHorizontal: 25,
    paddingTop: 10,
  },
  logStyle: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_12,
    lineHeight: Typography.LINE_HEIGHT_20,
    color: Colors.TEXT_COLOR,
    paddingVertical: 5,
  },
});
