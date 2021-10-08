import { uploadInventory } from '../actions/uploadInventory';
import { isLogin } from '../repositories/user';
import { auth0Login } from '../actions/user';

export const uploadInventoryData = (dispatch, userDispatch) => {
  return new Promise((resolve, reject) => {
    isLogin().then((isUserLogin) => {
      if (!isUserLogin) {
        auth0Login(userDispatch, dispatch)
          .then((isUserLogin) => {
            isUserLogin ? resolve() : reject(new Error('User is not logged in'));
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
            if (err?.message === 'blocked' || err?.message === 'denied') {
              reject(err);
            }
            console.error(err);
          });
      }
    });
  });
};
