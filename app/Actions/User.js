import { APIConfig } from './Config';
// import React, {useContext} from 'react';
import axios from 'axios';
import { getAllPendingInventory, statusToComplete } from './';
import { Coordinates, OfflineMaps, Polygons, User, Species, Inventory, AddSpecies } from './Schemas';
import Realm from 'realm';
import { Use } from 'react-native-svg';
import getSessionData from '../Utils/sessionId';

export const getUserInformation = () => {
  return new Promise((resolve, reject) => {
    Realm.open({ schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies] }).then(
      (realm) => {
        const User = realm.objectForPrimaryKey('User', 'id0001');
        console.log(User);
        if (User) {
          resolve({ email: User.email, firstName: User.firstname, lastName: User.lastname });
        } else {
          resolve({ email: '', firstName: '', lastName: '' });
        }
      },
    );
  });
};

export const getUserInformationFromServer = (navigation) => {
  return new Promise((resolve, reject) => {
    Realm.open({ schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User, AddSpecies] }).then(
      (realm) => {
        const User = realm.objectForPrimaryKey('User', 'id0001');
        let userToken = User.accessToken;
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
                const { email, firstname, lastname } = data.data;
                realm.create(
                  'User',
                  {
                    id: 'id0001',
                    email,
                    firstname,
                    lastname,
                  },
                  'modified',
                );
              });
              resolve(data.data);
            })
            .catch((err) => {
              if (err.response.status === 303) {
                navigation.navigate('SignUp');
              }
              reject(err);
            });
        });
      },
    );
    const { protocol, url } = APIConfig;
  });
};
