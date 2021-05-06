import Realm from 'realm';
import { v4 as uuidv4, v4 } from 'uuid';
import { bugsnag } from '../utils';
import { elementsType } from '../utils/additionalDataConstants';
import { LogTypes } from '../utils/constants';
import { getSchema } from './default';
import dbLog from './logs';

export const getForms = () => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        const form = realm.objects('Form');
        let formData = JSON.parse(JSON.stringify(form));

        formData = getElementData(formData, realm, 'fetch');

        console.log('\n\n\n\nformData', formData);

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
        resolve(Metadata);
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
          const elementId = v4();
          form.elements = [...form.elements, { ...elementProperties, id: elementId }];

          const schemaName = getSchemaNameFromType(elementProperties.type);

          console.log('schemaName', schemaName);

          if (schemaName) {
            const props = { ...typeProperties, id: v4(), parentId: elementId };
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
          console.log('elementData', elementData);
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
    console.log('formData new', formData);
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
