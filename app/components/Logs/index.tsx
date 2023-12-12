import {
  Text,
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import i18next from 'i18next';
import Share from 'react-native-share';
import { TabView } from 'react-native-tab-view';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';

import Header from '../Common/Header';
import { toBase64 } from '../../utils/base64';
import { AlertModal, Loader } from '../Common';
import { version } from '../../../package.json';
import { LogTypes } from '../../utils/constants';
import IconSwitcher from '../Common/IconSwitcher';
import { Colors, Typography } from '../../styles';
import CustomTabBar from '../Common/CustomTabBar';
import dbLog, { getLogs } from '../../repositories/logs';
import { askExternalStoragePermission } from '../../utils/permissions';

interface IRenderSceneProps {
  route: {
    key: string;
    title: string;
  };
}

const renderLog = ({ item }: any) => (
  <View>
    <Text style={styles.logStyle}>
      {i18next.t('label.logs_date', {
        date: new Date(Number(item.timestamp)),
      }) +
        ` ${item.appVersion} > ${item.referenceID ? item.referenceID : ''} ${
          item.statusCode ? item.statusCode : ''
        } ${item.message}`}
    </Text>
  </View>
);

const AllLogs = ({ allData, setAllData }: { allData: any; setAllData: any }) => {
  useEffect(() => {
    getLogs('all').then((data: any) => setAllData(data));
  }, []);

  return (
    <View style={[styles.scene, styles.defaultSpacing]}>
      <FlatList
        data={allData}
        style={styles.scene}
        renderItem={renderLog}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

const ErrorLogs = ({ errorData, setErrorData }: { errorData: any; setErrorData: any }) => {
  useEffect(() => {
    getLogs('error').then((data: any) => setErrorData(data));
  }, []);

  return (
    <View style={[styles.scene, styles.defaultSpacing]}>
      <FlatList
        data={errorData}
        style={styles.scene}
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
  const [showAlert, setShowAlert] = React.useState<boolean>(false);
  const [allData, setAllData] = useState(null);
  const [errorData, setErrorData] = useState(null);
  const [creatingLogsFile, setCreatingLogsFile] = useState<boolean>(false);

  const navigation = useNavigation();

  const renderScene = ({ route }: IRenderSceneProps) => {
    switch (route.key) {
      case 'allLogs':
        return <AllLogs allData={allData} setAllData={setAllData} />;
      case 'errorLogs':
        return <ErrorLogs errorData={errorData} setErrorData={setErrorData} />;
      default:
        return <></>;
    }
  };

  const handleSharePress = async () => {
    const permissionResult = await askExternalStoragePermission();
    if (permissionResult) {
      setCreatingLogsFile(true);
      const options = {
        url: 'data:application/json;base64,' + toBase64(JSON.stringify(allData)),
        title: i18next.t('label.share_activity_logs_title'),
        filename: i18next.t('label.share_logs_file_name', { version }),
        saveToFiles: true,
        failOnCancel: false,
        email: 'support@plant-for-the-planet.org',
        subject: i18next.t('label.share_logs_file_name', { version }),
      };

      Share.open(options)
        .then(() => setCreatingLogsFile(false))
        .catch(err => {
          if (err?.error?.code != 'ECANCELLED500') {
            // iOS cancel button pressed
            setShowAlert(true);
            dbLog.error({
              logType: LogTypes.OTHER,
              message: 'Error while sharing logs',
              logStack: JSON.stringify(err),
            });
          }
          setCreatingLogsFile(false);
        });
    }
  };

  const titleRightComponent = () => (
    <TouchableOpacity onPress={handleSharePress} style={styles.titleRightComponent}>
      <IconSwitcher
        size={24}
        iconType={'MCIcon'}
        name={'share-variant'}
        color={Colors.TEXT_COLOR}
      />
    </TouchableOpacity>
  );

  const renderTabBar = (props: any) => (
    <CustomTabBar {...props} tabRoutes={tabRoutes} setRouteIndex={setRouteIndex} />
  );

  const handleBackPress = () => navigation.goBack();
  const handlePressPrimaryBtn = () => setShowAlert(false);

  return (
    <SafeAreaView style={styles.mainContainer}>
      {creatingLogsFile ? (
        <Loader
          isLoaderShow={creatingLogsFile}
          loadingText={i18next.t('label.creating_logs_file_share')}
        />
      ) : (
        <>
          <View style={styles.defaultSpacing}>
            <Header
              closeIcon
              headingText={i18next.t('label.activity_logs')}
              onBackPress={handleBackPress}
              TitleRightComponent={titleRightComponent}
              containerStyle={{ paddingLeft: 25 }}
            />
          </View>
          <View style={styles.scene}>
            <TabView
              navigationState={{ index: routeIndex, routes: tabRoutes }}
              renderScene={renderScene}
              onIndexChange={setRouteIndex}
              initialLayout={initialLayout}
              renderTabBar={renderTabBar}
              sceneContainerStyle={{ paddingHorizontal: 25 }}
            />
          </View>
          <AlertModal
            visible={showAlert}
            heading={i18next.t('label.something_went_wrong')}
            message={i18next.t('label.share_additional_data_error')}
            primaryBtnText={i18next.t('label.ok')}
            onPressPrimaryBtn={handlePressPrimaryBtn}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  defaultSpacing: {},
  logStyle: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_12,
    lineHeight: Typography.LINE_HEIGHT_20,
    color: Colors.TEXT_COLOR,
    paddingVertical: 5,
  },
  titleRightComponent: {
    padding: 8,
    marginRight: 16,
  },
});
