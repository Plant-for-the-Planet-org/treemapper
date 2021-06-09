import RNFS from 'react-native-fs';
import {
  deleteAllAdditionalData,
  getSchemaNameFromType,
  importForm,
  importMetadata,
} from '../../repositories/additionalData';
import dbLog from '../../repositories/logs';
import { LogTypes } from '../constants';
import { MULTI, ON_SITE, SAMPLE, SINGLE } from '../inventoryConstants';
import { accessTypes, elementsType } from './constants';
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

export const getFormattedMetadata = (additionalDetails: any) => {
  let formattedDetails: any = { public: {}, private: {}, app: {} };

  if ((additionalDetails || Array.isArray(additionalDetails)) && additionalDetails.length > 0) {
    for (let detail of additionalDetails) {
      formattedDetails[`${detail.accessType}`][`${detail.key}`] = detail.value;
    }
  }
  return formattedDetails;
};

export const getFormattedAdditionalDetails = (metadata: any) => {
  let additionalDetails: any = [];

  if (metadata && Object.keys(metadata).length > 0) {
    for (const dataKey of Object.keys(metadata)) {
      const accessType =
        dataKey === 'public'
          ? accessTypes.PUBLIC
          : dataKey === 'private'
          ? accessTypes.PRIVATE
          : accessTypes.APP;

      for (const [key, value] of Object.entries(metadata[dataKey])) {
        additionalDetails.push({
          key,
          value,
          accessType,
        });
      }
    }
  }

  return additionalDetails;
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

interface IGetAppMetadata {
  data: any;
  isSampleTree?: boolean;
}

export const getFormattedAppAdditionalDetailsFromInventory = ({
  data,
  isSampleTree = false,
}: IGetAppMetadata): any[] => {
  const appAdditionalDetails: any[] = [];
  if (!data) {
    return appAdditionalDetails;
  }

  if (data.treeType === SINGLE || isSampleTree) {
    appAdditionalDetails.push({
      key: 'specieHeight',
      value: data.specieHeight.toString(),
      accessType: accessTypes.APP,
    });
    appAdditionalDetails.push({
      key: 'specieDiameter',
      value: data.specieDiameter.toString(),
      accessType: accessTypes.APP,
    });
    if (data.tagId) {
      appAdditionalDetails.push({
        key: 'tagId',
        value: data.tagId,
        accessType: accessTypes.APP,
      });
    }
  }

  // adding dates to additional details
  if (data.registrationDate) {
    appAdditionalDetails.push({
      key: 'registrationDate',
      value: data.registrationDate,
      accessType: accessTypes.APP,
    });
  }
  if (data.plantationDate) {
    appAdditionalDetails.push({
      key: 'plantationDate',
      value: data.plantationDate,
      accessType: accessTypes.APP,
    });
  }

  // adding species to additional details
  if (!isSampleTree) {
    for (const index in data.species) {
      const species = data.species[index];
      appAdditionalDetails.push({
        key: `speciesId${Number(index) + 1}`,
        value: species.id,
        accessType: accessTypes.APP,
      });
      appAdditionalDetails.push({
        key: `speciesAliases${Number(index) + 1}`,
        value: species.id === 'unknown' ? 'Unknown' : species.aliases,
        accessType: accessTypes.APP,
      });
      appAdditionalDetails.push({
        key: `speciesTreeCount${Number(index) + 1}`,
        value: species.treeCount.toString(),
        accessType: accessTypes.APP,
      });
    }

    if (data.projectId) {
      appAdditionalDetails.push({
        key: 'projectId',
        value: data.projectId,
        accessType: accessTypes.APP,
      });
    }
  } else {
    appAdditionalDetails.push({
      key: `speciesId1`,
      value: data.specieId,
      accessType: accessTypes.APP,
    });
    appAdditionalDetails.push({
      key: `speciesAliases1`,
      value: data.specieId === 'unknown' ? 'Unknown' : data.specieName,
      accessType: accessTypes.APP,
    });
    appAdditionalDetails.push({
      key: `speciesTreeCount1`,
      value: 1,
      accessType: accessTypes.APP,
    });
  }

  return appAdditionalDetails;
};
