import React from 'react';
import { View, Dimensions, StyleSheet, Text } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import Header from '../Common/Header';
import i18next from 'i18next';
import { useNavigation } from '@react-navigation/native';
import LogsTabBar from './LogsTabBar';

const AllLogs = () => <View style={[styles.scene, styles.defaultSpacing]} />;

const ErrorLogs = () => <View style={[styles.scene, styles.defaultSpacing]} />;
const initialLayout = { width: Dimensions.get('window').width };

export default function Logs() {
  const [routeIndex, setRouteIndex] = React.useState(0);
  const [tabRoutes] = React.useState([
    { key: 'allLogs', title: i18next.t('logs_all') },
    { key: 'errorLogs', title: i18next.t('logs_errors') },
  ]);
  const navigation = useNavigation();

  const renderScene = SceneMap({
    allLogs: AllLogs,
    errorLogs: ErrorLogs,
  });
  return (
    <View style={styles.mainContainer}>
      <View style={styles.defaultSpacing}>
        <Header
          closeIcon
          headingText={i18next.t('label.logs_page_title')}
          onBackPress={() => navigation.goBack()}
        />
      </View>
      <View style={{ flex: 1 }}>
        <TabView
          navigationState={{ index: routeIndex, routes: tabRoutes }}
          renderScene={renderScene}
          onIndexChange={setRouteIndex}
          initialLayout={initialLayout}
          renderTabBar={(props) => (
            <LogsTabBar {...props} tabRoutes={tabRoutes} setRouteIndex={setRouteIndex} />
          )}
        />
      </View>
    </View>
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
});
