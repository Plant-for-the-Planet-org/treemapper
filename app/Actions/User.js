import { APIConfig } from './Config';
// import React, {useContext} from 'react';
import axios from 'axios';
import { getAllPendingInventory, statusToComplete } from './';
import { Coordinates, OfflineMaps, Polygons, User, Species, Inventory } from './Schemas';
import Realm from 'realm';
import { Use } from 'react-native-svg';
import { SpeciesList } from '../Services/Species';

export const getUserInformation = () => {
  return new Promise((resolve, reject) => {
    Realm.open({ schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User] }).then(
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
    Realm.open({ schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User] }).then(
      (realm) => {
        const User = realm.objectForPrimaryKey('User', 'id0001');
        let userToken = User.accessToken;
        axios({
          method: 'GET',
          url: `${protocol}://${url}/treemapper/accountInfo`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `OAuth ${userToken}`,
          },
        })
          .then((data) => {
            // SpeciesList(userToken);
            data.data.push(userToken);
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
          });
      },
    );
    const { protocol, url } = APIConfig;
  });
};
