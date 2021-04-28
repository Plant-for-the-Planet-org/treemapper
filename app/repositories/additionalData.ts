import Realm from 'realm';
import { v4 as uuidv4 } from 'uuid';
import { bugsnag } from '../utils';
import { LogTypes } from '../utils/constants';
import { getSchema } from './default';
import dbLog from './logs';

export const getForms = () => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        const Form = realm.objects('Form');

        // logging the success in to the db
        dbLog.info({
          logType: LogTypes.ADDITIONAL_DATA,
          message: `Fetched all forms`,
        });
        resolve(Form);
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.ADDITIONAL_DATA,
          message: `Error while fetching forms`,
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
          message: `Fetched metadata`,
        });
        resolve(Metadata);
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.ADDITIONAL_DATA,
          message: `Error while fetching metadata`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const addForm = ({ fieldData, order }: any) => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let formData: any = {
            id: uuidv4(),
            order,
          };
          if (fieldData) {
            formData.fields = fieldData;
          }
          realm.create('Form', formData, Realm.UpdateMode.Modified);

          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.ADDITIONAL_DATA,
            message: `Added new form`,
          });
          resolve(true);
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.ADDITIONAL_DATA,
          message: `Error while adding new form`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const addField = ({ fieldData, formId }: any) => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        realm.write(() => {
          let form: any = realm.objectForPrimaryKey('Form', formId);
          form.fields = [...form.fields, fieldData];

          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.ADDITIONAL_DATA,
            message: `Added new field`,
          });
          resolve(true);
        });
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.ADDITIONAL_DATA,
          message: `Error while adding new field`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};
