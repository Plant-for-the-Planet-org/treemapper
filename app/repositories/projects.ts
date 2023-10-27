import Realm from 'realm';
import { bugsnag } from '../utils';
import { LogTypes, ProjectPurposeTypes } from '../utils/constants';
import dbLog from './logs';
import { getSchema } from './default';

export const getAllProjects = () => {
  return new Promise(resolve => {
    Realm.open(getSchema())
      .then(realm => {
        const projects = realm.objects('Projects');

        // logging the error in to the db
        dbLog.info({
          logType: LogTypes.PROJECTS,
          message: 'Fetched all available projects',
        });
        resolve(projects);
      })
      .catch(err => {
        console.error(err, 'Error');

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

export const getProjectById = (projectId: string) => {
  return new Promise(resolve => {
    Realm.open(getSchema())
      .then(realm => {
        const project = realm.objectForPrimaryKey('Projects', projectId);
        // logging the error in to the db
        dbLog.info({
          logType: LogTypes.PROJECTS,
          message: `Fetched project with id ${projectId}`,
        });
        resolve(project);
      })
      .catch(err => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.PROJECTS,
          message: `Error while fetching project with id ${projectId}`,
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};

export const deleteAllProjects = () => {
  return new Promise(resolve => {
    Realm.open(getSchema())
      .then(realm => {
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
      .catch(err => {
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

export const addProjects = (projects: any) => {
  return new Promise(resolve => {
    Realm.open(getSchema())
      .then(realm => {
        realm.write(() => {
          projects = projects.filter((project: any) =>
            ProjectPurposeTypes.includes(project?.properties?.purpose),
          );
          projects.forEach((project: any, index: number) => {
            const { properties } = project;
            const sites = [];

            const projectData: any = {
              allowDonations: properties.allowDonations,
              countPlanted: properties.countPlanted,
              countTarget: properties.countTarget,
              country: properties.country,
              currency: properties.currency,
              id: properties.id,
              image: properties.image ? properties.image : '',
              name: properties.name,
              slug: properties.slug,
              treeCost: properties.treeCost,
              sites: [],
              intensity: properties?.intensity ? properties.intensity : 100,
              frequency: properties?.frequency ? properties.frequency : 'Default',
              geometry: JSON.stringify(project.geometry),
            };

            for (const site of properties.sites) {
              sites.push({
                ...site,
                geometry: JSON.stringify(site.geometry),
              });
            }

            projectData.sites = sites;

            realm.create('Projects', projectData, Realm.UpdateMode.Modified);

            if (index === projects.length - 1) {
              // logging the error in to the db
              dbLog.info({
                logType: LogTypes.PROJECTS,
                message: 'Added all projects',
              });
              resolve(true);
            }
          });
        });
      })
      .catch(err => {
        // logging the error in to the db
        dbLog.error({
          logType: LogTypes.PROJECTS,
          message: 'Error while creating projects',
          logStack: JSON.stringify(err),
        });
        bugsnag.notify(err);
        resolve(false);
      });
  });
};
