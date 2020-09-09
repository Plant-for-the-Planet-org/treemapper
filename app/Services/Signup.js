import axios from 'axios';
import {APIConfig} from '../Actions/Config';

export const SignupService = async (payload) => {
  try {
    const {protocol, url} = APIConfig;
    console.log(payload);
    const res = await axios.post(`${protocol}://${url}/treemapper/profiles`, payload);
    console.log(res.data, 'response');
  } catch (error) {
    console.log(error, 'erroe');
  }
};
