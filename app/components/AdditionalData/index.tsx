import { useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, useWindowDimensions, View } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Share from 'react-native-share';
import { SceneMap, TabView } from 'react-native-tab-view';
import { addForm, getForms, getMetadata, updateMetadata } from '../../repositories/additionalData';
import dbLog from '../../repositories/logs';
import { Colors, Typography } from '../../styles';
import { readJsonFileAndAddAdditionalData } from '../../utils/additionalData/functions';
import { toBase64 } from '../../utils/base64';
import { LogTypes } from '../../utils/constants';
import { MULTI, OFF_SITE, ON_SITE, SAMPLE, SINGLE } from '../../utils/inventoryConstants';
import { filterFormByTreeAndRegistrationType, sortByField } from '../../utils/sortBy';
import { AlertModal, Loader } from '../Common';
import CustomTabBar from '../Common/CustomTabBar';
import Header from '../Common/Header';
import MenuOptions, { OptionsType } from '../Common/MenuOptions';
import Form from './Form';
import Metadata from './Metadata';

export default function AdditionalData() {
  const initialTreeTypeOptions = [
    { key: 'all', disabled: false, value: i18next.t('label.all') },
    { key: SINGLE, disabled: false, value: i18next.t('label.single') },
    { key: MULTI, disabled: false, value: i18next.t('label.multiple') },
    { key: SAMPLE, disabled: false, value: i18next.t('label.sample') },
  ];

  const initialRegistrationTypeOptions = [
    { key: 'all', disabled: false, value: i18next.t('label.all') },
    { key: ON_SITE, disabled: false, value: i18next.t('label.on_site') },
    { key: OFF_SITE, disabled: false, value: i18next.t('label.off_site') },
    // { type: 'REVIEW', disabled:false,value: i18next.t('label.review') },
  ];

  const [routeIndex, setRouteIndex] = useState(0);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [isImportingData, setIsImportingData] = useState<boolean>(false);
  const [alertHeading, setAlertHeading] = useState<string>('');
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [showSecondaryButton, setShowSecondaryButton] = useState<boolean>(false);
  const [forms, setForms] = useState<any>([]);
  const [filteredForm, setFilteredForm] = useState<any>([]);
  const [treeTypeOptions, setTreeTypeOptions] = useState<any>(initialTreeTypeOptions);
  const [registrationTypeOptions] = useState<any>(initialRegistrationTypeOptions);
  const [registrationType, setRegistrationType] = useState<string>('all');
  const [treeType, setTreeType] = useState<string>('all');
  const [selectedTreeOption, setSelectedTreeOption] = useState<any>();
  const [formLoading, setFormLoading] = useState<boolean>(true);
  const [metadataLoading, setMetadataLoading] = useState<boolean>(true);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [metadata, setMetadata] = useState<any>([]);

  const [tabRoutes] = useState([
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

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isInitialLoading) {
        addFormsToState();
        addMetadataInState();
        setIsInitialLoading(false);
      } else {
        if (routeIndex === 0) {
          addFormsToState();
        } else if (routeIndex === 1) {
          addMetadataInState();
        }
      }
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (registrationType === OFF_SITE) {
      let treeOptions = initialTreeTypeOptions;
      const lastIndex = treeOptions.length - 1;
      treeOptions[lastIndex] = { ...treeOptions[lastIndex], disabled: true };
      setTreeTypeOptions(treeOptions);
      if (treeType === SAMPLE) {
        setSelectedTreeOption(treeOptions[0]);
        setTreeType('all');
      }
    } else {
      setTreeTypeOptions(initialTreeTypeOptions);
    }
    updateStateFormData(JSON.parse(JSON.stringify(forms)));
  }, [treeType, registrationType]);

  const updateStateFormData = (formsData: any) => {
    formsData = filterFormByTreeAndRegistrationType(formsData, treeType, registrationType);
    setFilteredForm(formsData);
  };

  const addFormsToState = () => {
    setFormLoading(true);
    getForms().then((formsData: any) => {
      if (formsData) {
        formsData = sortByField('order', formsData);
        setForms(formsData);
        updateStateFormData(formsData);
      }
      setFormLoading(false);
    });
  };

  const addMetadataInState = () => {
    setMetadataLoading(true);
    getMetadata().then((data: any) => {
      if (data) {
        setMetadata(sortByField('order', data));
      }
      setMetadataLoading(false);
    });
  };

  const updateMetadataOrder = async (updatedMetadata: any) => {
    await updateMetadata(updatedMetadata).then((success: boolean) => {
      if (success) {
        addMetadataInState();
      }
    });
  };

  const addNewForm = async () => {
    await addForm({ order: Array.isArray(filteredForm) ? filteredForm.length + 1 : 1 });
    addFormsToState();
  };

  const renderScene = SceneMap({
    form: () => (
      <Form
        {...{
          filteredForm,
          addFormsToState,
          loading: formLoading,
          registrationTypeOptions,
          setRegistrationType,
          treeTypeOptions,
          setTreeType,
          selectedTreeOption,
          addNewForm,
        }}
      />
    ),
    metadata: () => (
      <Metadata
        {...{ metadata, updateMetadataOrder, addMetadataInState, loading: metadataLoading }}
      />
    ),
  });

  const handleImportExport = async (option: OptionsType) => {
    if (option.key === 'export') {
      const exportData = {
        formData: forms,
        metadata,
      };

      const options = {
        url: 'data:application/json;base64,' + toBase64(JSON.stringify(exportData)),
        message: i18next.t('label.export_additional_data_message'),
        title: i18next.t('label.export_additional_data_title'),
        filename: `TreeMapper-Additional-Data`,
        saveToFiles: true,
        failOnCancel: false,
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
      setShowAlert(false);
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
            navigationState={{ index: routeIndex, routes: tabRoutes }}
            renderScene={renderScene}
            onIndexChange={setRouteIndex}
            initialLayout={{ width: layout.width }}
            renderTabBar={(props) => (
              <CustomTabBar {...props} tabRoutes={tabRoutes} setRouteIndex={setRouteIndex} />
            )}
            swipeEnabled={false}
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
