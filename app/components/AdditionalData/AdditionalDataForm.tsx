import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import i18next from 'i18next';
import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { InventoryContext } from '../../reducers/inventory';
import { getForms } from '../../repositories/additionalData';
import { getInventory, updateInventory, updateLastScreen } from '../../repositories/inventory';
import dbLog from '../../repositories/logs';
import { Colors } from '../../styles';
import { marginTop24 } from '../../styles/design';
import { elementsType, inputTypes, numberRegex } from '../../utils/additionalDataConstants';
import { LogTypes } from '../../utils/constants';
import { INCOMPLETE_SAMPLE_TREE, MULTI, SINGLE } from '../../utils/inventoryConstants';
import { filterFormByTreeAndRegistrationType, sortByField } from '../../utils/sortBy';
import { Header, Loader } from '../Common';
import PrimaryButton from '../Common/PrimaryButton';
import ElementSwitcher from './ElementSwitcher';

interface IAdditionalDataFormProps {}

const AdditionalDataForm = (props: IAdditionalDataFormProps) => {
  const [forms, setForms] = useState<any>([]);
  const [currentFormIndex, setCurrentFormIndex] = useState<number>(0);
  const [treeType, setTreeType] = useState<string>('');
  const [locateTree, setLocateTree] = useState<string>('');
  const [inventoryStatus, setInventoryStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [headingText, setHeadingText] = useState<string>(i18next.t('label.additional_data'));
  const [formData, setFormData] = useState<any>({});
  const [formAccessType, setFormAccessType] = useState<any>({});
  const [errors, setErrors] = useState<any>({});
  const [inventory, setInventory] = useState<any>();

  const { state: inventoryState } = useContext(InventoryContext);

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (inventoryState.inventoryID) {
        let data = { inventory_id: inventoryState.inventoryID, lastScreen: 'AdditionalDataForm' };
        updateLastScreen(data);
        setLoading(true);
        getInventory({ inventoryID: inventoryState.inventoryID }).then((inventoryData) => {
          if (inventoryData) {
            setInventory(inventoryData);
            setTreeType(inventoryData.treeType);
            setLocateTree(inventoryData.locateTree);
            setInventoryStatus(inventoryData.status);
            addFormsToState(inventoryData.treeType, inventoryData.locateTree);
          }
        });
      }
    });
    return unsubscribe;
  }, [navigation, inventoryState.inventoryID]);

  const updateHeading = (formsData: any, index: number = currentFormIndex) => {
    setHeadingText(
      formsData[index].title || `${i18next.t('label.additional_data')} - ${index + 1}`,
    );
  };

  const addFormsToState = (treeType: string, registrationType: string) => {
    getForms().then((formsData: any) => {
      if (formsData) {
        formsData = sortByField('order', formsData);

        formsData = filterFormByTreeAndRegistrationType(formsData, treeType, registrationType);

        const shouldShowForm =
          formsData && formsData.length > 0 && formsData[0].elements.length > 0;

        setForms(formsData);

        let data: any = {};
        let accessTypes: any = {};
        let initialErrors: any = {};
        for (const form of formsData) {
          for (const element of form.elements) {
            if (element.type !== elementsType.GAP && element.type !== elementsType.HEADING) {
              const yseNoValue = element.defaultValue ? 'yes' : 'no';
              data[element.key] =
                typeof element.defaultValue === 'boolean' ? yseNoValue : element.defaultValue;
              accessTypes[element.key] = element.accessType;
            }
            initialErrors[element.key] = '';
          }
          setFormData(data);
          setFormAccessType(accessTypes);
          setErrors(initialErrors);
          updateHeading(formsData);
        }

        if (!shouldShowForm) {
          navigate();
        }
      } else {
        navigate();
      }
      setLoading(false);
    });
  };

  const navigate = () => {
    let nextScreen = '';

    if (
      treeType === SINGLE ||
      (treeType === MULTI &&
        inventoryStatus === INCOMPLETE_SAMPLE_TREE &&
        inventory.completedSampleTreesCount !== inventory.sampleTreesCount)
    ) {
      nextScreen = 'SingleTreeOverview';
    } else {
      nextScreen = 'InventoryOverview';
    }

    console.log('nextScreen', nextScreen);

    navigation.dispatch(
      CommonActions.reset({
        index: 2,
        routes: [{ name: 'MainScreen' }, { name: 'TreeInventory' }, { name: nextScreen }],
      }),
    );
  };

  const setFormValuesCallback = (updatedField: any, accessType: any) => {
    const data = {
      ...formData,
      ...updatedField,
    };
    setFormData(data);

    setFormAccessType({
      ...formAccessType,
      ...accessType,
    });
  };

  const handleContinueClick = () => {
    let updatedErrors: any = {};
    let errorCount = 0;
    for (const elementData of forms[currentFormIndex].elements) {
      const isInvalidNumber =
        formData[elementData.key] &&
        elementData.type === elementsType.INPUT &&
        elementData.inputType === inputTypes.NUMBER &&
        !numberRegex.test(formData[elementData.key]);

      if (elementData.isRequired && !formData[elementData.key]) {
        updatedErrors[elementData.key] = i18next.t('label.required_field');
        errorCount += 1;
      } else if (isInvalidNumber) {
        updatedErrors[elementData.key] = i18next.t('label.invalid_input');
        errorCount += 1;
      } else {
        updatedErrors[elementData.key] = '';
      }
    }
    setErrors(updatedErrors);
    console.log('errorCount', errorCount);
    if (errorCount === 0) {
      const nextIndex = currentFormIndex + 1;
      if (forms[nextIndex] && forms[nextIndex].elements.length > 0) {
        setCurrentFormIndex(nextIndex);
        updateHeading(forms, nextIndex);
      } else {
        let transformedData = [];

        for (const dataKey of Object.keys(formData)) {
          transformedData.push({
            key: dataKey,
            value: formData[dataKey],
            accessType: formAccessType[dataKey],
          });
        }

        let inventoryData;
        if (
          inventoryStatus === INCOMPLETE_SAMPLE_TREE &&
          inventory.completedSampleTreesCount !== inventory.sampleTreesCount
        ) {
          console.log('inventory.sampleTrees', inventory.sampleTrees);
          let updatedSampleTrees = [...inventory.sampleTrees];
          updatedSampleTrees[
            inventory.completedSampleTreesCount
          ].additionalDetails = transformedData;
          inventoryData = {
            sampleTrees: updatedSampleTrees,
          };
        } else {
          inventoryData = {
            additionalDetails: transformedData,
          };
        }

        console.log('inventoryData', inventoryData);
        updateInventory({ inventory_id: inventoryState.inventoryID, inventoryData })
          .then(() => {
            console.log('updated');
            dbLog.info({
              logType: LogTypes.ADDITIONAL_DATA,
              message: `Successfully added additional details to inventory with id ${inventoryState.inventoryID}`,
            });
            navigate();
          })
          .catch((err) => {
            console.log('error', err);
            dbLog.error({
              logType: LogTypes.ADDITIONAL_DATA,
              message: `Failed to add additional details to inventory with id ${inventoryState.inventoryID}`,
              logStack: JSON.stringify(err),
            });
          });
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {loading ? (
        <Loader isLoaderShow={loading} loadingText={i18next.t('label.loading_form')} />
      ) : (
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Header headingText={headingText} />
            {forms.length > 0 &&
              forms[currentFormIndex].elements.map((element: any, index: number) => (
                <View
                  style={[
                    marginTop24,
                    index === forms[currentFormIndex].elements.length - 1
                      ? { marginBottom: 40 }
                      : {},
                  ]}
                  key={element.key}>
                  <ElementSwitcher
                    {...{
                      ...element,
                      editable: true,
                      fieldKey: element.key,
                      setFormValuesCallback,
                      error: errors[element.key],
                    }}
                  />
                </View>
              ))}
          </ScrollView>
          <PrimaryButton
            btnText={i18next.t('label.continue')}
            onPress={handleContinueClick}
            style={{ marginTop: 10 }}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default AdditionalDataForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
  },
});
