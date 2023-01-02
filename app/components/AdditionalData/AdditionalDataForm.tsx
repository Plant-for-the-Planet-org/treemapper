import {CommonActions, useNavigation} from '@react-navigation/native';
import i18next from 'i18next';
import React, {useContext, useEffect, useState} from 'react';
import {SafeAreaView, ScrollView, StyleSheet, View} from 'react-native';
import {InventoryContext} from '../../reducers/inventory';
import {getForms, getMetadata} from '../../repositories/additionalData';
import {getInventory, updateInventory, updateLastScreen} from '../../repositories/inventory';
import dbLog from '../../repositories/logs';
import {Colors} from '../../styles';
import {marginTop24} from '../../styles/design';
import {
  accessTypes,
  elementsType,
  inputTypes,
  numberRegex,
} from '../../utils/additionalData/constants';
import {
  filterFormByTreeAndRegistrationType,
  sortByField,
} from '../../utils/additionalData/functions';
import {LogTypes} from '../../utils/constants';
import {INCOMPLETE_SAMPLE_TREE, MULTI, SINGLE} from '../../utils/inventoryConstants';
import {Header, Loader} from '../Common';
import PrimaryButton from '../Common/PrimaryButton';
import ElementSwitcher from './ElementSwitcher';
import {version} from '../../../package.json';
import {addAdditionDataToPlantLocationHistory} from '../../repositories/plantLocationHistory';

const AdditionalDataForm = ({route}: {route: any}) => {
  const [forms, setForms] = useState<any>([]);
  const [currentFormIndex, setCurrentFormIndex] = useState<number>(0);
  const [treeType, setTreeType] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingText, setLoadingText] = useState<string>(i18next.t('label.loading_form'));
  const [headingText, setHeadingText] = useState<string>(i18next.t('label.additional_data'));
  const [formData, setFormData] = useState<any>({});
  const [formAccessType, setFormAccessType] = useState<any>({});
  const [errors, setErrors] = useState<any>({});
  const [inventory, setInventory] = useState<any>();
  const [isSampleTree, setIsSampleTree] = useState<boolean>(false);
  const [isRemeasurement, setIsRemeasurement] = useState<boolean>(false);
  const [isTreeAlive, setIsTreeAlive] = useState<boolean>(false);

  const {state: inventoryState} = useContext(InventoryContext);

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log(route?.params, 'route?.params');

      if (route?.params && route.params.isRemeasurement) {
        setIsRemeasurement(route.params.isRemeasurement);
        setIsTreeAlive(route.params.isTreeAlive);
      }
      if (inventoryState.inventoryID) {
        let data = {inventory_id: inventoryState.inventoryID, lastScreen: 'AdditionalDataForm'};
        updateLastScreen(data);
        setLoading(true);
        getInventory({inventoryID: inventoryState.inventoryID}).then(inventoryData => {
          if (inventoryData) {
            setInventory(inventoryData);
            setTreeType(inventoryData.treeType);
            const isSample =
              inventoryData.treeType === MULTI &&
              inventoryData.status === INCOMPLETE_SAMPLE_TREE &&
              inventoryData.completedSampleTreesCount !== inventoryData.sampleTreesCount;
            setIsSampleTree(isSample);
            addFormsToState({
              treeType: inventoryData.treeType,
              registrationType: route?.params?.isRemeasurement
                ? 'REMEASUREMENT'
                : inventoryData.locateTree,
              isSample,
              inventoryData,
              isRemeasurement: route?.params?.isRemeasurement,
              isTreeAlive: route?.params?.isTreeAlive,
            });
          }
        });
      }
    });
    return unsubscribe;
  }, [navigation, route?.params, inventoryState.inventoryID]);

  const updateHeading = (formsData: any, index: number = currentFormIndex) => {
    setHeadingText(
      formsData[index].title || `${i18next.t('label.additional_data')} - ${index + 1}`,
    );
  };

  const addFormsToState = ({
    treeType,
    registrationType,
    isSample,
    inventoryData,
    isRemeasurement,
    isTreeAlive,
  }: {
    treeType: string;
    registrationType: string;
    isSample: boolean;
    inventoryData?: any;
    isRemeasurement?: any;
    isTreeAlive?: any;
  }) => {
    getForms().then(async (formsData: any) => {
      let transformedData = [
        {
          key: 'appVersion',
          value: version,
          accessType: accessTypes.APP,
        },
      ];

      const metadata: any = await getMetadata();

      for (const index in metadata) {
        delete metadata[index].id;
        delete metadata[index].order;
      }
      transformedData = [...transformedData, ...metadata];
      // const isRemeasurement = true;
      // setIsRemeasurement(isRemeasurement);
      if (formsData) {
        formsData = sortByField('order', formsData);

        // const registrationType = 'REMEASUREMENT';
        // setIsRemeasurement();
        console.log(treeType, registrationType, isSample, isRemeasurement, '=====');
        formsData = filterFormByTreeAndRegistrationType(
          formsData,
          treeType,
          registrationType,
          isSample,
          isRemeasurement,
        );

        const shouldShowForm =
          formsData && formsData.length > 0 && formsData[0].elements.length > 0;

        if (!shouldShowForm) {
          console.log('1');

          setLoadingText(i18next.t('label.no_form_redirect_next_screen'));

          addAdditionalDataToDB({
            transformedData,
            isSample,
            disableNavigation: true,
            inventoryData,
            isRemeasurement,
            isTreeAlive,
          });
          setTimeout(() => navigate(treeType, isSample, isRemeasurement, isTreeAlive), 2000);
          return;
        }

        setForms(formsData);

        let data: any = {};
        let formAccessTypes: any = {};
        let initialErrors: any = {};
        for (const form of formsData) {
          for (const element of form.elements) {
            if (element.type !== elementsType.GAP && element.type !== elementsType.HEADING) {
              const yesNoValue = element.defaultValue ? 'yes' : 'no';
              data[element.key] =
                typeof element.defaultValue === 'boolean' ? yesNoValue : element.defaultValue;
              formAccessTypes[element.key] = element.accessType;
            }
            initialErrors[element.key] = '';
          }
          setFormData(data);
          setFormAccessType(formAccessTypes);
          setErrors(initialErrors);
          updateHeading(formsData);
        }

        setLoading(false);
      } else {
        console.log('22');

        setLoadingText(i18next.t('label.no_form_redirect_next_screen'));
        addAdditionalDataToDB({
          transformedData,
          isSample,
          disableNavigation: true,
          inventoryData,
        });
        setTimeout(() => navigate(treeType, isSample, isRemeasurement, isTreeAlive), 2000);
      }
    });
  };

  console.log(isRemeasurement, '==isRemeasurement==');

  const addAdditionalDataToDB = ({
    transformedData,
    isSample = false,
    disableNavigation = false,
    inventoryData = null,
    isRemeasurement = false,
    isTreeAlive = false,
  }: {
    transformedData: any[];
    isSample: boolean;
    disableNavigation?: boolean;
    inventoryData?: any;
    isRemeasurement?: boolean;
    isTreeAlive?: boolean;
  }) => {
    inventoryData = inventoryData || inventory;
    let data;
    console.log(JSON.stringify(transformedData), 'transformedData', isRemeasurement);

    if (isSample) {
      let updatedSampleTrees = [...inventoryData.sampleTrees];
      updatedSampleTrees[inventoryData.completedSampleTreesCount].additionalDetails =
        transformedData;
      data = {
        sampleTrees: updatedSampleTrees,
      };
    } else {
      ('33');
      data = {
        additionalDetails: transformedData,
      };
    }

    if (isRemeasurement) {
      console.log('2');

      addAdditionDataToPlantLocationHistory({
        remeasurementId: inventoryState.selectedRemeasurementId,
        additionalData: transformedData,
        lastScreen: isTreeAlive ? 'TakePicture' : 'RemeasurementReview',
      })
        .then(() => {
          console.log('3');

          dbLog.info({
            logType: LogTypes.ADDITIONAL_DATA,
            message: `Successfully added additional details to inventory with id ${inventoryState.inventoryID}`,
          });
          if (!disableNavigation) {
            console.log('4');

            navigate('', null, isRemeasurement, isTreeAlive);
          }
        })
        .catch(err => {
          dbLog.error({
            logType: LogTypes.ADDITIONAL_DATA,
            message: `Failed to add additional details to inventory with id ${inventoryState.inventoryID}`,
            logStack: JSON.stringify(err),
          });
        });
    } else {
      console.log('5');

      updateInventory({inventory_id: inventoryState.inventoryID, inventoryData: data})
        .then(() => {
          dbLog.info({
            logType: LogTypes.ADDITIONAL_DATA,
            message: `Successfully added additional details to inventory with id ${inventoryState.inventoryID}`,
          });
          if (!disableNavigation) {
            navigate();
          }
        })
        .catch(err => {
          dbLog.error({
            logType: LogTypes.ADDITIONAL_DATA,
            message: `Failed to add additional details to inventory with id ${inventoryState.inventoryID}`,
            logStack: JSON.stringify(err),
          });
        });
    }
  };

  const navigate = (
    type: string = '',
    isSample: boolean | null = null,
    isRemeasurement: boolean | null = null,
    isTreeAlive: boolean | null = null,
  ) => {
    let nextScreen = '';
    isSample = isSample ?? isSampleTree;
    type = type || treeType;
    console.log(isRemeasurement, 'isRemeasurement');

    if ((type === SINGLE || isSample) && !isRemeasurement) {
      nextScreen = 'SingleTreeOverview';
    } else if (isRemeasurement) {
      nextScreen = isTreeAlive ? 'TakePicture' : 'RemeasurementReview';
    } else {
      nextScreen = 'InventoryOverview';
    }
    setLoading(false);
    if (isRemeasurement) {
      navigation.navigate(nextScreen);
    } else {
      navigation.dispatch(
        CommonActions.reset({
          index: 2,
          routes: [{name: 'MainScreen'}, {name: 'TreeInventory'}, {name: nextScreen}],
        }),
      );
    }
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

  const handleContinueClick = async () => {
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
        updatedErrors[elementData.key] = i18next.t('label.invalid_number_input');
        errorCount += 1;
      } else {
        updatedErrors[elementData.key] = '';
      }
    }
    setErrors(updatedErrors);

    if (errorCount === 0) {
      const nextIndex = currentFormIndex + 1;
      if (forms[nextIndex] && forms[nextIndex].elements.length > 0) {
        setCurrentFormIndex(nextIndex);
        updateHeading(forms, nextIndex);
      } else {
        let transformedData = [];
        const metadata: any = await getMetadata();

        for (const dataKey of Object.keys(formData)) {
          if (formData[dataKey]) {
            transformedData.push({
              key: dataKey,
              value: formData[dataKey],
              accessType: formAccessType[dataKey],
            });
          }
        }

        for (const index in metadata) {
          delete metadata[index].id;
          delete metadata[index].order;
        }

        transformedData.push({
          key: 'appVersion',
          value: version,
          accessType: accessTypes.APP,
        });

        transformedData = [...transformedData, ...metadata];
        addAdditionalDataToDB({transformedData, isSample: isSampleTree, isRemeasurement});
      }
    }
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={styles.container}>
        {loading ? (
          <Loader isLoaderShow={loading} loadingText={loadingText} />
        ) : (
          <>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Header headingText={headingText} />
              {forms.length > 0 &&
                forms[currentFormIndex].elements.map((element: any, index: number) => (
                  <View
                    style={[
                      marginTop24,
                      index === forms[currentFormIndex].elements.length - 1
                        ? {marginBottom: 40}
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
              style={{marginTop: 10}}
            />
          </>
        )}
      </View>
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
