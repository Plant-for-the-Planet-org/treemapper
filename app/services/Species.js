import axios from 'axios';
import { APIConfig } from '../actions/Config';
import {
  Coordinates,
  OfflineMaps,
  Polygons,
  User,
  Species,
  Inventory,
  AddSpecies,
} from '../repositories/schema';
import Realm from 'realm';
import getSessionData from '../utils/sessionId';

const { protocol, url } = APIConfig;
export const AllSpecies = () => {
  return new Promise((resolve, reject) => {
    let headers = {
      'Content-Type': 'application/json',
      'X-Accept-Version': 'v2.0',
    };
    axios
      .get(`${protocol}://${url}/treemapper/scientificSpecies`, headers)
      .then((res) => {
        const { data, status } = res;
        if (status === 200) {
          resolve(data);
        }
      })
      .catch((err) => {
        console.error(err, 'error');
      });
  });
};

export const SearchSpecies = (payload) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    })
      .then((realm) => {
        realm.write(() => {
          const SearchSpeciesUser = realm.objectForPrimaryKey('User', 'id0001');
          let userToken = SearchSpeciesUser.accessToken;
          let formData = new FormData();
          formData.append('q', payload);
          formData.append('t', 'species');
          getSessionData()
            .then(async (sessionData) => {
              await axios({
                method: 'POST',
                url: `${protocol}://${url}/suggest.php`,
                data: formData,
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `OAuth ${userToken}`,
                  'x-session-id': sessionData,
                },
              })
                .then((res) => {
                  const { data, status } = res;
                  if (status === 200) {
                    resolve(data);
                  }
                })
                .catch((err) => {
                  reject(err);
                  console.error(err, 'error');
                });
            })
            .catch((err) => {
              console.error(err);
              reject(err);
            });
        });
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
};

export const SpeciesList = (userToken) => {
  return new Promise((resolve, reject) => {
    axios({
      method: 'GET',
      url: `${protocol}://${url}/treemapper/species`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `OAuth ${userToken}`,
      },
    })
      .then((res) => {
        const { data, status } = res;
        if (status === 200) {
          resolve(data);
        }
      })
      .catch((err) => {
        reject(err);
        console.error(err, 'error');
      });
  });
};
