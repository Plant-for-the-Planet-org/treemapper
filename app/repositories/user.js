import { bugsnag } from '../Utils';

export const getUserToken = () => {
  return new Promise((resolve, reject) => {
    Realm.open({
      schema: [User],
    })
      .then((realm) => {
        // Gets the user data from the DB
        const User = realm.objectForPrimaryKey('User', 'id0001');
        const userToken = User.userToken;

        // closes the realm connection
        realm.close();

        // returns userToken
        resolve(userToken);
      })
      .catch((err) => {
        console.error(`Error: /repositories/getUserToken -> ${JSON.stringify(err)}`);
        bugsnag.notify(err);
        reject();
      });
  });
};
