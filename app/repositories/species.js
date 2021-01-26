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

export const AddUserSpecies = ({ aliases, image, scientificName, speciesId }) => {
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
          realm.create('AddSpecies', {
            id,
            aliases,
            image,
            scientificName,
            status: 'pending',
            speciesId,
          });
          resolve(id);
        });
      })
      .catch((err) => {
        reject(err);
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
          resolve(JSON.parse(JSON.stringify(species)));
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

export const importJSON = ({ objs }) => {
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
          objs.forEach((specie) => {
            // console.log(obj);
            realm.create('ScientificSpecies', specie);
          });
          // for (const specie of objs) {
          //   realm.create('ScientificSpecies', specie);
          //   // console.log(specie);
          // }
          resolve(console.log('Species Created'));
        });
      })
      .catch((err) => {
        reject(err);
        console.log(err);
        bugsnag.notify(err);
      });
  });
};

// export const searchSpecies = (text) => {
//   return new Promise((resolve, reject) => {
//     Realm.open({
//       schema: [
//         Inventory,
//         Species,
//         Polygons,
//         Coordinates,
//         OfflineMaps,
//         User,
//         AddSpecies,
//         ScientificSpecies,
//       ],
//     }).then((realm) => {
//       let species = realm.objects('ScientificSpecies');
//       let searchedSpecies = species.filtered(`scientific_name BEGINSWITH "${text}"`);
//       // console.log(searchedSpecies);
//       setSearchList(searchedSpecies);
//     });
//   });
// };