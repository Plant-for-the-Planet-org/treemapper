import React, { useEffect, useState }from 'react';
import { View, Dimensions, StyleSheet, Text, FlatList, SafeAreaView } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import Header from '../Common/Header';
import i18next from 'i18next';
import { useNavigation } from '@react-navigation/native';
import LogsTabBar from './LogsTabBar';
// import { FlatList } from 'react-native-gesture-handler';
import {getLogs} from '../../repositories/logs';
import { Colors, Typography } from '_styles';

const renderLog = ({ item }) => (
  <View>
    <Text style={styles.logStyle}>
      {i18next.t('label.logs_date', {
            date: new Date(Number(item.timestamp)),
      }) + ` ${item.appVersion} > ${item.referenceID? item.referenceID: ''} ${item.statusCode? item.statusCode: ''} ${item.message}`}
    </Text>
  </View>
);

const AllLogs = () => {
  const[allData, setAllData] = useState(null);
  useEffect(() => {
    getLogs('all')
    .then((data)=> setAllData(data));
  }, []);
  return(
    <View style={[styles.scene, styles.defaultSpacing]}>
      <FlatList
        style={{ flex: 1 }}
        data={allData}
        renderItem={renderLog}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

const ErrorLogs = () => {
  const[errorData, setErrorData] = useState(null);
  useEffect(() => {
    getLogs('error')
    .then((data)=> setErrorData(data));
  }, []);
  return(
    <View style={[styles.scene, styles.defaultSpacing]}>
      <FlatList
        style={{ flex: 1 }}
        data={errorData}
        renderItem={renderLog}
        keyExtractor={item => item.id}
      />
    </View>
  );
};
const initialLayout = { width: Dimensions.get('window').width };

export default function Logs() {
  const [routeIndex, setRouteIndex] = React.useState(0);
  const [tabRoutes] = React.useState([
    { key: 'allLogs', title: i18next.t('label.logs_all') },
    { key: 'errorLogs', title: i18next.t('label.logs_errors') },
  ]);
  const navigation = useNavigation();

  const renderScene = SceneMap({
    allLogs: AllLogs,
    errorLogs: ErrorLogs,
  });
  return (
    <SafeAreaView style={styles.mainContainer}>
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
    </SafeAreaView>
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
    paddingVertical: 5
  }
});
