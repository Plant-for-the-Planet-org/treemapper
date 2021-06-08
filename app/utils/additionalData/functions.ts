import RNFS from 'react-native-fs';
import {
  deleteAllAdditionalData,
  getMetadata,
  getSchemaNameFromType,
  importForm,
  importMetadata,
} from '../../repositories/additionalData';
import dbLog from '../../repositories/logs';
import { LogTypes } from '../constants';
import { MULTI, ON_SITE, SAMPLE } from '../inventoryConstants';
import { elementsType } from './constants';
import { IAdditionalDataImport, IFormData } from './interfaces';

export const sortByField = (fieldName: string, arrayData: any) => {
  return arrayData.sort((a: any, b: any) => {
    return a[`${fieldName}`] - b[`${fieldName}`];
  });
};

export const filterFormByTreeAndRegistrationType = (
  formData: any,
  treeType: string,
  registrationType: string,
  isSampleTree: boolean = false,
) => {
  console.log('treeType', treeType);
  console.log('registrationType', registrationType);
  console.log('isSampleTree', isSampleTree);
  if (treeType && treeType.toLowerCase() !== 'all') {
    if (isSampleTree === true && registrationType === ON_SITE && treeType === MULTI) {
      treeType = SAMPLE;
    }
    for (let i in formData) {
      let elements: any = formData[i].elements;
      elements = elements.filter((element: any) => element.treeType.includes(treeType));
      formData[i].elements = elements;
    }
  }
  if (
    registrationType &&
    registrationType.toLowerCase() !== 'all' &&
    (!isSampleTree || (isSampleTree === true && registrationType === ON_SITE && treeType === MULTI))
  ) {
    for (let i in formData) {
      let elements: any = formData[i].elements;
      elements = elements.filter((element: any) =>
        element.registrationType.includes(registrationType),
      );
      formData[i].elements = elements;
    }
  }
  return formData;
};

export const formatAdditionalDetails = async (additionalDetails: any, sampleTrees: any = null) => {
  console.log('additionalDetails', additionalDetails);
  let formattedDetails: any = { public: {}, private: {}, app: {} };

  const metadata = await getMetadata();

  if (Array.isArray(metadata) && metadata.length > 0) {
    for (let detail of metadata) {
      formattedDetails[`${detail.accessType}`][`${detail.key}`] = detail.value;
    }
  }
  if ((additionalDetails || Array.isArray(additionalDetails)) && additionalDetails.length > 0) {
    for (let detail of additionalDetails) {
      formattedDetails[`${detail.accessType}`][`${detail.key}`] = detail.value;
    }
  }
  if ((sampleTrees || Array.isArray(sampleTrees)) && sampleTrees.length > 0) {
    for (const i in sampleTrees) {
      for (let detail of sampleTrees[i].additionalDetails) {
        formattedDetails[`${detail.accessType}`][`ST${Number(i) + 1}-${detail.key}`] = detail.value;
      }
    }
  }
  return formattedDetails;
};

export const formatSampleTreeAdditionalDetails = (additionalDetails: any, index: number) => {
  let formattedDetails: any = { public: {}, private: {}, app: {} };

  for (let detail of additionalDetails) {
    formattedDetails[`${detail.accessType}`][`ST${Number(index) + 1}-${detail.key}`] = detail.value;
  }
  return formattedDetails;
};

const isAdditionalData = (object: any): object is IAdditionalDataImport => {
  return 'formData' in object && 'metadata' in object;
};

export const readJsonFileAndAddAdditionalData = (res: any) => {
  return new Promise((resolve, reject) => {
    const jsonFilePath = res.uri;

    // reads the file content using the passed target path in utf-8 format
    RNFS.readFile(jsonFilePath, 'utf8')
      .then(async (jsonContent) => {
        dbLog.info({
          logType: LogTypes.ADDITIONAL_DATA,
          message: `Successfully imported file and fetched file content to add additional data`,
        });

        try {
          // parses the content to make is feasible to read and update the contents in DB
          jsonContent = JSON.parse(jsonContent);
          if (isAdditionalData(jsonContent)) {
            let updatedFormData: any = [];
            let elementTypeData: any = [];
            for (const form of jsonContent.formData) {
              let formData: IFormData = {
                id: form.id,
                title: form.title,
                description: form.description,
                order: form.order,
                elements: [],
              };
              let elements = [];
              for (const element of form.elements) {
                const {
                  id,
                  key,
                  name,
                  type,
                  treeType,
                  registrationType,
                  accessType,
                  ...typeProperties
                } = element;

                elements.push({
                  id,
                  key,
                  name,
                  type,
                  treeType,
                  registrationType,
                  accessType,
                });

                formData.elements = elements;

                if (Object.keys(typeProperties).length > 0) {
                  const typeProps: any = {
                    id: typeProperties.subElementId,
                    defaultValue: typeProperties.defaultValue,
                    isRequired: typeProperties.isRequired,
                    parentId: id,
                  };
                  if (type === elementsType.DROPDOWN) {
                    typeProps.dropdownOptions = typeProperties.dropdownOptions;
                  } else if (type === elementsType.INPUT) {
                    typeProps.type = typeProperties.inputType;
                    typeProps.regexValidation = typeProperties.regexValidation;
                  }
                  elementTypeData.push({
                    schemaName: getSchemaNameFromType(type),
                    typeProps,
                  });
                }
              }
              updatedFormData.push(formData);
            }
            const isAdditionalDataCleared = await deleteAllAdditionalData();
            if (isAdditionalDataCleared) {
              const isFormDataAdded = await importForm(updatedFormData, elementTypeData);
              const isMetadataAdded = await importMetadata(jsonContent.metadata);
              if (isFormDataAdded || isMetadataAdded) {
                dbLog.info({
                  logType: LogTypes.ADDITIONAL_DATA,
                  message: 'Successfully imported additional data',
                });
                resolve(isFormDataAdded || isMetadataAdded);
              } else {
                reject(new Error('Import of data was unsuccessful'));
              }
            } else {
              reject(new Error('Something went wrong'));
            }
          } else {
            reject(new Error('Incorrect JSON file format'));
            return;
          }
        } catch (err) {
          dbLog.error({
            logType: LogTypes.ADDITIONAL_DATA,
            message: 'Invalid JSON string to parse',
            logStack: JSON.stringify(err),
          });
          reject(err);
          return;
        }
      })
      .catch((err) => {
        dbLog.error({
          logType: LogTypes.ADDITIONAL_DATA,
          message: 'Error while reading imported file',
          logStack: JSON.stringify(err),
        });
        reject(err);
      });
  });
};
