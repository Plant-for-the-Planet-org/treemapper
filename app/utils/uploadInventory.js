import { uploadInventory } from '../actions/UploadInventory';
import { isLogin } from '../repositories/user';
import { auth0Login } from '../actions/user';

export const uploadInventoryData = (dispatch, userDispatch) => {
  return new Promise((resolve, reject) => {
    isLogin().then((isUserLogin) => {
      if (!isUserLogin) {
        auth0Login(userDispatch)
          .then((isUserLogin) => {
            isUserLogin ? resolve() : reject();
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        uploadInventory(dispatch)
          .then(() => {
            resolve();
          })
          .catch((err) => {
            if (err === 'blocked' || err === 'denied') {
              reject(err);
            }
            console.error(err);
          });
      }
    });
  });
};
