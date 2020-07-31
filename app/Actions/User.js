import { Config } from './Config';
import axios from 'axios';
import { getAllPendingInventory, statusToComplete } from './';
import { Coordinates, OfflineMaps, Polygons, User, Species, Inventory } from './Schemas'
import Realm from 'realm';
import { Use } from 'react-native-svg';


export const getUserInformation = () => {
    return new Promise((resolve, reject) => {
        Realm.open({ schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User] })
            .then(realm => {
                const User = realm.objectForPrimaryKey('User', 'id0001');
                resolve({ email: User.email, firstName: User.firstname, lastName: User.lastname })
            })
    })
}

export const getUserInformationFromServer = () => {
    return new Promise((resolve, reject) => {
        Realm.open({ schema: [Inventory, Species, Polygons, Coordinates, OfflineMaps, User] })
            .then(realm => {
                const User = realm.objectForPrimaryKey('User', 'id0001');
                let userToken = User.accessToken;
                axios({
                    method: 'GET',
                    url: `${protocol}://${url}/treemapper/accountInfo`,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `OAuth ${userToken}`
                    },
                }).then((data) => {
                    realm.write(() => {
                        const { email, firstname, lastname } = data.data
                        realm.create('User', {
                            id: 'id0001',
                            email, firstname, lastname
                        }, 'modified')
                    })
                }).catch((err) => {
                })

            })
        const { protocol, url } = Config

    })
}
