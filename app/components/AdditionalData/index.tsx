import { useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import React from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { SceneMap, TabView } from 'react-native-tab-view';
import { Colors, Typography } from '_styles';
import CustomTabBar from '../Common/CustomTabBar';
import Header from '../Common/Header';
import Form from './Form';
import Metadata from './Metadata';
import SelectElement from './SelectElement';

const initialLayout = { width: Dimensions.get('window').width };

export default function AdditionalData() {
  const [routeIndex, setRouteIndex] = React.useState(0);
  const [tabRoutes] = React.useState([
    { key: 'additionalDataForm', title: i18next.t('label.additional_data_form') },
    { key: 'additionalDataMetadata', title: i18next.t('label.additional_data_metadata') },
  ]);
  const navigation = useNavigation();

  const renderScene = SceneMap({
    form: Form,
    metadata: Metadata,
  });
  return (
    <SelectElement />
    // <SafeAreaView style={styles.mainContainer}>
    //   <ScrollView>
    //     <View style={styles.defaultSpacing}>
    //       <Header
    //         closeIcon
    //         headingText={i18next.t('label.additional_data')}
    //         onBackPress={() => navigation.goBack()}
    //       />
    //     </View>
    //     <View style={{ flex: 1 }}>
    //       <TabView
    //         navigationState={{ index: routeIndex, routes: tabRoutes }}
    //         renderScene={renderScene}
    //         onIndexChange={setRouteIndex}
    //         initialLayout={initialLayout}
    //         renderTabBar={(props) => (
    //           <CustomTabBar {...props} tabRoutes={tabRoutes} setRouteIndex={setRouteIndex} />
    //         )}
    //       />
    //     </View>
    //   </ScrollView>
    // </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
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
