import Realm from 'realm';
import { v4 as uuidv4 } from 'uuid';
import { bugsnag } from '../utils';
import { elementsType } from '../utils/additionalDataConstants';
import { LogTypes } from '../utils/constants';
import { getSchema } from './default';
import dbLog from './logs';

export const getForms = (treeType: string = '', locateTree: string = '') => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        let form = realm.objects('Form');
        if (treeType) {
          form = form.filtered(`elements.treeType CONTAINS '${treeType}'`);
        }
        if (locateTree) {
          form = form.filtered(`elements.registrationType CONTAINS '${locateTree}'`);
        }
        let formData = JSON.parse(JSON.stringify(form));

        formData = getElementData(formData, realm, 'fetch');

        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.ADDITIONAL_DATA,
          message: 'Fetched all forms',
        });
        resolve(formData);
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.ADDITIONAL_DATA,
          message: 'Error while fetching forms',
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const addForm = ({ order, title, description = '' }: any) => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let form: any = realm.objects('Form').filtered(`order >= ${order}`);

          for (let i in form) {
            form[i].order = form[i].order + 1;
          }

          let formData: any = {
            id: uuidv4(),
            order,
            title,
            description,
          };
          realm.create('Form', formData, Realm.UpdateMode.Modified);

          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.ADDITIONAL_DATA,
            message: 'Added new form',
          });
          resolve(true);
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.ADDITIONAL_DATA,
          message: 'Error while adding new form',
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const addElement = ({ elementProperties, typeProperties = null, formId }: any) => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let form: any = realm.objectForPrimaryKey('Form', formId);
          const elementId = uuidv4();
          form.elements = [...form.elements, { ...elementProperties, id: elementId }];

          const schemaName = getSchemaNameFromType(elementProperties.type);

          console.log('schemaName', schemaName);

          if (schemaName) {
            const props = { ...typeProperties, id: uuidv4(), parentId: elementId };
            console.log('props', props);
            realm.create(`${schemaName}`, props);
          }

          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.ADDITIONAL_DATA,
            message: 'Added new element',
          });
          resolve(true);
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.ADDITIONAL_DATA,
          message: 'Error while adding new element',
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const deleteForm = (formId: any) => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let form: any = realm.objectForPrimaryKey('Form', formId);
          getElementData([form], realm, 'delete');

          realm.delete(form);

          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.ADDITIONAL_DATA,
            message: `Successfully deleted form with id ${formId}`,
          });
          resolve(true);
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.ADDITIONAL_DATA,
          message: `Error while deleting form with id ${formId}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const deleteFormElement = (formId: string, elementIndexToDelete: number) => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let form: any = realm.objectForPrimaryKey('Form', formId);

          if (form?.elements.length > 0) {
            form.elements.splice(elementIndexToDelete, 1);
          }

          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.ADDITIONAL_DATA,
            message: `Successfully deleted index element ${elementIndexToDelete} from form with id ${formId}`,
          });
          resolve(true);
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.ADDITIONAL_DATA,
          message: `Error while deleting index element ${elementIndexToDelete} from form with id ${formId}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

const getElementData = (formData: any, realm: any, action: string) => {
  for (const i in formData) {
    for (const j in formData[i].elements) {
      const schemaName: string = getSchemaNameFromType(formData[i].elements[j].type);
      if (schemaName) {
        let data: any = realm
          .objects(`${schemaName}`)
          .filtered(`parentId='${formData[i].elements[j].id}'`);
        data = JSON.parse(JSON.stringify(data));
        if (action === 'delete') {
          realm.write(() => {
            realm.delete(data);
          });
        } else if (Array.isArray(data) && data.length === 1) {
          let elementData = data[0];
          delete elementData.id;
          delete elementData.parentId;
          if (formData[i].elements[j].type === elementsType.INPUT) {
            elementData.inputType = elementData.type;
            delete elementData.type;
          }
          formData[i].elements[j] = {
            ...formData[i].elements[j],
            ...elementData,
          };
        }
      }
    }
  }
  return formData;
};

const getSchemaNameFromType = (elementType: string) => {
  switch (elementType) {
    case elementsType.DROPDOWN:
      return 'Dropdown';
    case elementsType.INPUT:
      return 'Input';
    case elementsType.YES_NO:
      return 'YesNo';
    default:
      return '';
  }
};

export const updateFormElements = ({ elements, formId }: any) => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let form: any = realm.objectForPrimaryKey('Form', formId);

          form.elements = elements;

          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.ADDITIONAL_DATA,
            message: `Successfully updated elements of form with id ${formId}`,
          });
          resolve(true);
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.ADDITIONAL_DATA,
          message: `Error while updating elements of form with id ${formId}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const getMetadata = () => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        const Metadata = realm.objects('Metadata');

        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.ADDITIONAL_DATA,
          message: 'Fetched metadata',
        });
        resolve(Metadata ? JSON.parse(JSON.stringify(Metadata)) : []);
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.ADDITIONAL_DATA,
          message: 'Error while fetching metadata',
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const addOrUpdateMetadataField = (fieldData: any): Promise<boolean> => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          realm.create(
            'Metadata',
            {
              id: fieldData.id ? fieldData.id : uuidv4(),
              key: fieldData.key,
              value: fieldData.value,
              order: fieldData.order,
            },
            Realm.UpdateMode.Modified,
          );

          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.ADDITIONAL_DATA,
            message: 'Added a new metadata field',
          });
          resolve(true);
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.ADDITIONAL_DATA,
          message: 'Error while adding a new metadata field',
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const deleteMetadataField = (fieldId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          const metadata = realm.objectForPrimaryKey('Metadata', fieldId);
          realm.delete(metadata);
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.ADDITIONAL_DATA,
            message: `Deleted metadata field with id ${fieldId}`,
          });
          resolve(true);
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.ADDITIONAL_DATA,
          message: `Error while deleting metadata fields with id ${fieldId}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const updateMetadata = (metadata: any[]): Promise<boolean> => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          if (Array.isArray(metadata)) {
            for (let i = 0; i < metadata.length; i++) {
              console.log({
                ...metadata[i],
                order: i,
              });
              realm.create(
                'Metadata',
                {
                  ...metadata[i],
                  order: i,
                },
                Realm.UpdateMode.Modified,
              );
            }
          }
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.ADDITIONAL_DATA,
            message: 'Updated metadata fields',
          });
          resolve(true);
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.ADDITIONAL_DATA,
          message: 'Error while updating metadata fields',
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};
