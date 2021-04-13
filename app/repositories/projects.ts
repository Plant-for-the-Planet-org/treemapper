import Realm from 'realm';
import { bugsnag } from '../utils';
import { LogTypes } from '../utils/constants';
import dbLog from './logs';
import { getSchema } from './default';

export const getAllProjects = () => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        const projects = realm.objects('Projects');
        // logging the error in to the db
        dbLog.info({
          logType: LogTypes.PROJECTS,
          message: 'Fetched all available projects',
        });
        resolve(projects);
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.PROJECTS,
          message: 'Error while fetching projects',
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const deleteAllProjects = () => {
  return new Promise((resolve) => {
    Realm.open(getSchema())
      .then((realm) => {
        const projects = realm.objects('Projects');
        realm.write(() => {
          realm.delete(projects);
          // logging the error in to the db
          dbLog.info({
            logType: LogTypes.PROJECTS,
            message: 'Deleted all available projects',
          });
        });
        resolve(true);
      })
      .catch((err) => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.PROJECTS,
          message: 'Error while deleting projects',
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};
