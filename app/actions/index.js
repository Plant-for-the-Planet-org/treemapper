import Realm from 'realm';
import { bugsnag } from '../utils/index';
import Config from 'react-native-config';
import Auth0 from 'react-native-auth0';
import {
  Coordinates,
  OfflineMaps,
  Polygons,
  User,
  Species,
  Inventory,
  AddSpecies,
} from './Schemas';
import { uploadInventory } from './UploadInventory';
import { getUserInformationFromServer, getUserInformation } from './User';

// AUTH0 CONFIG
const auth0 = new Auth0({ domain: Config.AUTH0_DOMAIN, clientId: Config.AUTH0_CLIENT_ID });

//  ---------------- AUTH0 ACTIONS START----------------

export const auth0Login = (navigation) => {
  return new Promise((resolve, reject) => {
    auth0.webAuth
      .authorize({ scope: 'openid email profile' }, { ephemeralSession: true })
      .then((credentials) => {
        const { accessToken, idToken } = credentials;
        Realm.open({
          schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
        }).then((realm) => {
          realm.write(() => {
            realm.create(
              'User',
              {
                id: 'id0001',
                accessToken: accessToken,
                idToken,
              },
              'modified',
            );
            getUserInformationFromServer(navigation).then(() => {
              resolve(true);
            });
          });
        });
      })
      .catch((error) => {
        console.error('auth0 error', error);
        reject(error);
      });
  });
};

export const auth0Logout = () => {
  return new Promise((resolve, reject) => {
    auth0.webAuth
      .clearSession()
      .then(() => {
        Realm.open({
          schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
        }).then((realm) => {
          realm.write(() => {
            const user = realm.objectForPrimaryKey('User', 'id0001');
            realm.delete(user);
            resolve(true);
          });
        });
      })
      .catch((error) => {
        alert('error');
        reject(error);
      });
  });
};

export const isLogin = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    }).then((realm) => {
      const User = realm.objects('User');
      if (User[0]) {
        resolve(true);
      } else {
        resolve(false);
      }
      // realm.close();
    });
  });
};

export const LoginDetails = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          const User = realm.objects('User');
          resolve(JSON.parse(JSON.stringify(User)));
        });
        // realm.close();
      })
      .catch((err) => {
        reject(err);
      });
  });
};

//  ---------------- AUTH0 ACTIONS END----------------

export const getAreaName = ({ coords }) => {
  return new Promise((resolve, reject) => {
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json?types=place&access_token=${Config.MAPBOXGL_ACCCESS_TOKEN}`,
    )
      .then((res) => res.json())
      .then((res) => {
        if (res && res.features && res.features[0]) {
          resolve(res.features[0].place_name);
        } else {
          reject();
        }
      });
  });
};

export const getAllOfflineMaps = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          const offlineMaps = realm.objects('OfflineMaps');
          resolve(JSON.parse(JSON.stringify(offlineMaps)));
        });
      })
      .catch(bugsnag.notify);
  });
};

export const deleteOfflineMap = ({ name }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          const offlineMaps = realm.objectForPrimaryKey('OfflineMaps', `${name}`);
          realm.delete(offlineMaps);
          resolve();
        });
      })
      .catch(bugsnag.notify);
  });
};

export const createOfflineMap = ({ name, size, areaName }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          realm.create('OfflineMaps', {
            name: name,
            size: size,
            areaName: areaName,
          });
          resolve(name);
        });
      })
      .catch((err) => {
        reject(err);
        bugsnag.notify(err);
      });
  });
};

export const AddUserSpecies = ({ aliases, image, scientificName, speciesId }) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
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
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
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
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
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
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
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
export const filterSpecies = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          const species = realm.objects('AddSpecies');
          let fiteredSpecies = species.filtered('aliases != "" && status == "pending"');
          resolve(JSON.parse(JSON.stringify(fiteredSpecies)));
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
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          const species = realm.objects('AddSpecies');
          let fiteredSpecies = species.filtered('status == "pending"');
          resolve(JSON.parse(JSON.stringify(fiteredSpecies)));
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
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
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

export { uploadInventory, getUserInformation };
