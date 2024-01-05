// axiosInstance.js
import axios from 'axios';
import { ENVS } from '../environment';
import { store } from '../redux/store';

const axiosInstance = axios.create({
  baseURL: `${'https'}://${ENVS[store.getState().envSlice.currentEnv].API_ENDPOINT}`,
});

store.subscribe(() => {
  axiosInstance.defaults.baseURL = `${'https'}://${
    ENVS[store.getState().envSlice.currentEnv].API_ENDPOINT
  }`;
});

export default axiosInstance;
