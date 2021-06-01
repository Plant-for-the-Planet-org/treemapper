import { useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SceneMap, TabView } from 'react-native-tab-view';
import FA5Icon from 'react-native-vector-icons/FontAwesome5';
import { getForms, getMetadata } from '../../repositories/additionalData';
import { Colors, Typography } from '../../styles';
import CustomTabBar from '../Common/CustomTabBar';
import Header from '../Common/Header';
import MenuOptions, { OptionsType } from '../Common/MenuOptions';
import Form from './Form';
import Metadata from './Metadata';
import Share from 'react-native-share';
import { toBase64 } from '../../utils/base64';
import { AlertModal, Loader } from '../Common';
import DocumentPicker from 'react-native-document-picker';
import dbLog from '../../repositories/logs';
import { LogTypes } from '../../utils/constants';
import { readJsonFileAndAddAdditionalData } from '../../utils/additionalData/functions';

export default function AdditionalData() {
  const [routeIndex, setRouteIndex] = React.useState(0);
  const [showAlert, setShowAlert] = React.useState<boolean>(false);
  const [isImportingData, setIsImportingData] = React.useState<boolean>(false);
  const [alertHeading, setAlertHeading] = React.useState<string>('');
  const [alertMessage, setAlertMessage] = React.useState<string>('');
  const [showSecondaryButton, setShowSecondaryButton] = React.useState<boolean>(false);

  const [tabRoutes] = React.useState([
    { key: 'form', title: i18next.t('label.additional_data_form') },
    { key: 'metadata', title: i18next.t('label.additional_data_metadata') },
  ]);
  const layout = useWindowDimensions();
  const navigation = useNavigation();

  const options: OptionsType[] = [
    {
      key: 'import',
      iconType: 'FA5Icon',
      iconName: 'file-import',
      text: 'label.import_data',
    },
    {
      key: 'export',
      iconType: 'FA5Icon',
      iconName: 'file-export',
      text: 'label.export_data',
    },
  ];

  const renderScene = SceneMap({
    form: () => <Form routeIndex={routeIndex} />,
    metadata: () => <Metadata routeIndex={routeIndex} />,
  });

  const handleImportExport = async (option: OptionsType) => {
    if (option.key === 'export') {
      const formData = await getForms();
      const metadata = await getMetadata();

      const exportData = {
        formData,
        metadata,
      };

      const options = {
        url: 'data:application/json;base64,' + toBase64(JSON.stringify(exportData)),
        message: i18next.t('label.export_additional_data_message'),
        title: i18next.t('label.export_additional_data_title'),
        filename: `TreeMapper-Additional-Data`,
        saveToFiles: true,
        // failOnCancel: false,
      };
      Share.open(options).catch((err) => {
        setAlertHeading(i18next.t('label.something_went_wrong'));
        setAlertMessage(i18next.t('label.share_additional_data_error'));
        setShowSecondaryButton(false);
        setShowAlert(true);

        dbLog.error({
          logType: LogTypes.ADDITIONAL_DATA,
          message: `Error while sharing additional data`,
          logStack: JSON.stringify(err),
        });
      });
    } else if (option.key === 'import') {
      const forms: any = await getForms();
      if (forms && forms.length > 0) {
        setAlertHeading(i18next.t('label.confirm_wipe_additional_data_import'));
        setAlertMessage(i18next.t('label.current_additional_data_lost'));
        setShowSecondaryButton(true);
        setShowAlert(true);
      } else {
        importJsonFile();
      }
    }
  };

  const closeAlertModal = () => setShowAlert(false);

  const importJsonFile = async () => {
    try {
      // pick json file from file system
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      setShowAlert(false);
      setIsImportingData(true);
      await readJsonFileAndAddAdditionalData(res);
      setIsImportingData(false);
    } catch (err) {
      setIsImportingData(false);
      if (err?.message === 'Incorrect JSON file format') {
        setAlertHeading(i18next.t('label.incorrect_file_format'));
        setAlertMessage(i18next.t('label.incorrect_format_additional_data_import'));
        setShowSecondaryButton(false);
        setShowAlert(true);
      } else if (err?.message !== 'User canceled document picker') {
        setAlertHeading(i18next.t('label.something_went_wrong'));
        setAlertMessage(i18next.t('label.import_file_error'));
        setShowSecondaryButton(false);
        setShowAlert(true);

        dbLog.error({
          logType: LogTypes.ADDITIONAL_DATA,
          message: `Failed to import file to add additional data`,
          logStack: JSON.stringify(err),
        });
      }
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={{ flex: 1 }}>
        <View style={styles.defaultSpacing}>
          <Header
            closeIcon
            headingText={i18next.t('label.additional_data')}
            onBackPress={() => navigation.goBack()}
            TitleRightComponent={() => (
              <MenuOptions options={options} onOptionPress={handleImportExport} />
            )}
          />
        </View>
        {isImportingData ? (
          <Loader isLoaderShow={isImportingData} />
        ) : (
          <TabView
            lazy
            navigationState={{ index: routeIndex, routes: tabRoutes }}
            renderScene={renderScene}
            onIndexChange={setRouteIndex}
            initialLayout={{ width: layout.width }}
            renderTabBar={(props) => (
              <CustomTabBar {...props} tabRoutes={tabRoutes} setRouteIndex={setRouteIndex} />
            )}
          />
        )}
        <AlertModal
          visible={showAlert}
          heading={alertHeading}
          message={alertMessage}
          primaryBtnText={showSecondaryButton ? i18next.t('label.yes') : i18next.t('label.ok')}
          onPressPrimaryBtn={showSecondaryButton ? importJsonFile : closeAlertModal}
          showSecondaryButton={showSecondaryButton}
          secondaryBtnText={i18next.t('label.cancel')}
          onPressSecondaryBtn={closeAlertModal}
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
