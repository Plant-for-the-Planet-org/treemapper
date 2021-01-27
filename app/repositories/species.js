import Realm from 'realm';
import { bugsnag } from '../utils';
import {
  Coordinates,
  OfflineMaps,
  Polygons,
  User,
  Species,
  Inventory,
  AddSpecies,
  ScientificSpecies,
} from './schema';

export const AddUserSpecies = ( scientificName, speciesId ) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [
        Inventory,
        Species,
        Polygons,
        Coordinates,
        OfflineMaps,
        User,
        AddSpecies,
        ScientificSpecies,
      ],
    })
      .then((realm) => {
        realm.write(() => {
          let id = `${new Date().getTime()}`;
          console.log(id, scientificName, speciesId, 'In AddUserSpwcies');
          realm.create('AddSpecies', {
            id,
            // aliases,
            // image,
            scientificName,
            // status: 'pending',
            speciesId,
          });
          resolve(id);
          console.log('Species added');
        });
      })
      .catch((err) => {
        reject(err);
        console.log(err);
        bugsnag.notify(err);
      });
  });
};

export const getAllSpecies = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [
        Inventory,
        Species,
        Polygons,
        Coordinates,
        OfflineMaps,
        User,
        AddSpecies,
        ScientificSpecies,
      ],
    })
      .then((realm) => {
        realm.write(() => {
          const species = realm.objects('AddSpecies');
          let data = JSON.parse(JSON.stringify(species));
          console.log(data);
          resolve(data);
        });
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const insertImageForUserSpecies = ({ id, imagePath }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [
        Inventory,
        Species,
        Polygons,
        Coordinates,
        OfflineMaps,
        User,
        AddSpecies,
        ScientificSpecies,
      ],
    })
      .then((realm) => {
        realm.write(() => {
          let specie = realm.objectForPrimaryKey('AddSpecies', `${id}`);
          specie.image = imagePath;
          resolve(true);
        });
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};
export const updateNameForUserSpecies = ({ id, aliases }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [
        Inventory,
        Species,
        Polygons,
        Coordinates,
        OfflineMaps,
        User,
        AddSpecies,
        ScientificSpecies,
      ],
    })
      .then((realm) => {
        realm.write(() => {
          let specie = realm.objectForPrimaryKey('AddSpecies', `${id}`);
          specie.aliases = aliases;
          resolve(true);
        });
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const filterPendingSpecies = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [
        Inventory,
        Species,
        Polygons,
        Coordinates,
        OfflineMaps,
        User,
        AddSpecies,
        ScientificSpecies,
      ],
    })
      .then((realm) => {
        realm.write(() => {
          const species = realm.objects('AddSpecies');
          let filteredSpecies = species.filtered('status == "pending"');
          resolve(JSON.parse(JSON.stringify(filteredSpecies)));
        });
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const updateStatusForUserSpecies = ({ id }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [
        Inventory,
        Species,
        Polygons,
        Coordinates,
        OfflineMaps,
        User,
        AddSpecies,
        ScientificSpecies,
      ],
    })
      .then((realm) => {
        realm.write(() => {
          let specie = realm.objectForPrimaryKey('AddSpecies', `${id}`);
          specie.status = 'complete';
          resolve(true);
        });
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const updateLocalSpecies = (speciesData) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [
        Inventory,
        Species,
        Polygons,
        Coordinates,
        OfflineMaps,
        User,
        AddSpecies,
        ScientificSpecies,
      ],
    })
      .then((realm) => {
        realm.write(() => {
          for (const specie of speciesData) {
            realm.create('ScientificSpecies', specie);
          }
          resolve(true);
        });
      })
      .catch((err) => {
        reject(false);
        console.error(`Error at /repositories/species/updateLocalSpecies, ${JSON.stringify(err)}`);
        bugsnag.notify(err);
      });
  });
};

export const searchSpecies = (text) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [
        Inventory,
        Species,
        Polygons,
        Coordinates,
        OfflineMaps,
        User,
        AddSpecies,
        ScientificSpecies,
      ],
    })
    .then((realm) => {
      let species = realm.objects('ScientificSpecies');
      let searchedSpecies = species.filtered(`scientific_name BEGINSWITH "${text}"`);
      resolve(searchedSpecies);
    })
    .catch((err) => {
      reject(err);
      console.error(`Error at /repositories/species/searchSpecies, ${JSON.stringify(err)}`);
      bugsnag.notify(err);
    })
  });
};
