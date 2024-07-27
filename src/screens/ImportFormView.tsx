import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { Colors, Typography } from 'src/utils/constants';
import i18next from 'src/locales/index';
import FA5Icon from '@expo/vector-icons/FontAwesome5';
import AlertModal from 'src/components/common/AlertModal';
import LargeButton from 'src/components/common/LargeButton';
import Header from 'src/components/common/Header';
import ImportIcon from 'assets/images/svg/ImportIcon.svg'
import { useRealm } from '@realm/react';
import { RealmSchema } from 'src/types/enum/db.enum';
import { toBase64 } from 'src/utils/constants/base64';
import Share from 'react-native-share';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system'
import { useToast } from 'react-native-toast-notifications';
import useMetaData from 'src/hooks/realm/useMetaData';
import useAdditionalForm from 'src/hooks/realm/useAdditionalForm';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from 'src/types/type/navigation.type';


const ImportFormView = () => {
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [isImportingData] = useState<boolean>(false);
  const [alertHeading, setAlertHeading] = useState<string>('');
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [showSecondaryButton, setShowSecondaryButton] = useState<boolean>(false);
  const toast = useToast()
  const { bulkMetaDataAddition: bulkMetaDataAddition, deleteAllMetaData } = useMetaData()
  const { bulkFormAddition, deleteAllAdditionalData } = useAdditionalForm()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const realm = useRealm();

  const handleImport = () => {
    setAlertHeading(i18next.t('label.confirm_wipe_additional_data_import'));
    setAlertMessage(i18next.t('label.current_additional_data_lost'));
    setShowSecondaryButton(true);
    setShowAlert(true);
  }



  const handleExport = async () => {
    const formData = realm.objects(RealmSchema.AdditonalDetailsForm);
    const metaData = realm.objects(RealmSchema.Metadata);
    const options = {
      url: 'data:application/json;base64,' + toBase64(JSON.stringify({
        formData,
        metaData,
        version: 1
      })),
      message: "Exporting Additional/MetaData",
      title: "Export",
      filename: `formData_v1.json`,
      saveToFiles: true,
    };
    Share.open(options)
      .then(() => {
        //
      })
      .catch(() => {
        // shows error if occurred and not canceled by the user

      });
  }

  const importJsonFile = async () => {
    try {
      await deleteAllAdditionalData()  
      await deleteAllMetaData()
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json'
      });
      if (!result.canceled) {
        await readImportedFile(result.assets[0].uri)
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  }

  const closeAlertModal = () => {
    setShowAlert(false)
  }

  const readImportedFile = async (url: string) => {
    const jsonData = await FileSystem.readAsStringAsync(
      url,
      { encoding: 'utf8' },
    )
    const parsedData = JSON.parse(jsonData)
    if (parsedData?.version) {
      const { formData, metaData } = parsedData
      await bulkMetaDataAddition(metaData)
      await bulkFormAddition(formData)
      toast.show("Form Data added successfully")
      navigation.goBack()
    } else {
      toast.show("Provided file is invalid")
      setShowAlert(false);
    }
  }


  return (
    <SafeAreaView style={styles.safeAreaView}>
      <Header
        label={i18next.t('label.import_export_data')}
      />
      <View style={styles.container}>
        {isImportingData ? (
          <View style={styles.importingContainer}>
            <ImportIcon />
            <Text style={styles.importingText}>{i18next.t('label.importing_additional_data')}</Text>
            <ActivityIndicator
              size="large"
              color={Colors.PRIMARY}
              style={styles.activityIndicator}
            />
          </View>
        ) : (
          <>
            <LargeButton
              onPress={handleImport}
              heading={i18next.t('label.import_data')}
              subHeading={i18next.t('label.import_data_desc')}
              testID={'import_additional_data'}
              accessibilityLabel={'import_additional_data'}
              leftComponent={<FA5Icon name={'file-import'} color={Colors.TEXT_COLOR} size={40} />}
            />
            <LargeButton
              onPress={handleExport}
              heading={i18next.t('label.export_data')}
              subHeading={`${i18next.t('label.export_data_desc')}`}
              testID={'export_additional_data'}
              accessibilityLabel={'export_additional_data'}
              leftComponent={<FA5Icon name={'file-export'} color={Colors.TEXT_COLOR} size={40} />}
            />
          </>
        )}
      </View>
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
    </SafeAreaView>
  );
};

export default ImportFormView;

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  activityIndicator: {
    paddingVertical: 20,
  },
  container: {
    paddingHorizontal: 25,
    flex: 1,
  },
  wrapper: {
    paddingHorizontal: 25,
    flex: 1,
  },
  importingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  importingText: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.TEXT_COLOR,
    textAlign: 'center',
    marginTop: 60,
  },
});
