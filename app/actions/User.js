import { APIConfig } from './Config';
// import React, {useContext} from 'react';
import axios from 'axios';
import {
  Coordinates,
  OfflineMaps,
  Polygons,
  User,
  Species,
  Inventory,
  AddSpecies,
} from './Schemas';
import Realm from 'realm';
import getSessionData from '../utils/sessionId';

export const getUserInformation = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    }).then((realm) => {
      const User = realm.objectForPrimaryKey('User', 'id0001');
      if (User) {
        resolve({
          email: User.email,
          firstName: User.firstname,
          lastName: User.lastname,
          country: User.country,
        });
      } else {
        resolve({ email: '', firstName: '', lastName: '' });
      }
    });
  });
};

export const getUserInformationFromServer = (navigation) => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies],
    }).then((realm) => {
      const User = realm.objectForPrimaryKey('User', 'id0001');
      let userToken = User.accessToken;
      console.log(userToken, 'Token');
      getSessionData().then((sessionData) => {
        axios({
          method: 'GET',
          url: `${protocol}://${url}/app/profile`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `OAuth ${userToken}`,
            'x-session-id': sessionData,
          },
        })
          .then((data) => {
            realm.write(() => {
              const { email, firstname, lastname, country } = data.data;
              realm.create(
                'User',
                {
                  id: 'id0001',
                  email,
                  firstname,
                  lastname,
                  country,
                },
                'modified',
              );
            });
            resolve(data.data);
          })
          .catch((err) => {
            console.error('err.response.status =>>', err);
            if (err.response.status === 303) {
              navigation.navigate('SignUp');
            }
            reject(err);
          });
      });
      // realm.close();
    });
    const { protocol, url } = APIConfig;
  });
};
