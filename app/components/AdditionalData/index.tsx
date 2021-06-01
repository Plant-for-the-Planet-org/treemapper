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
import { AlertModal } from '../Common';

export default function AdditionalData() {
  const [routeIndex, setRouteIndex] = React.useState(0);
  const [showAlert, setShowAlert] = React.useState<boolean>(false);
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
      Share.open(options).catch(() => setShowAlert(true));
    } else if (option.key === 'import') {
      // pick json file from file system
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
        <AlertModal
          heading={i18next.t('label.something_went_wrong')}
          message={i18next.t('label.not_able_to_share_additional_data')}
          showSecondaryButton={false}
          visible={showAlert}
          onPressPrimaryBtn={() => setShowAlert(false)}
          primaryBtnText={i18next.t('label.ok')}
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
