import axios from 'axios';
import { APIConfig } from '../actions/Config';
import dbLog from '../repositories/logs';
import { LogTypes } from '../utils/constants';

export const SignupService = (payload) => {
  // try {
  return new Promise((resolve, reject) => {
    const { protocol, url } = APIConfig;
    axios
      .post(`${protocol}://${url}/app/profile`, payload)
      .then((res) => {
        const { status, data } = res;
        if (status === 200) {
          // logging the success in to the db
          dbLog.info({
            logType: LogTypes.MANAGE_SPECIES,
            message: 'Successfully Signed up',
            statusCode: status,
          });
          resolve(data);
        }
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
};
