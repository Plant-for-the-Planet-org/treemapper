import {getUrlApi} from './api.url';
import {fetchGetCall} from './customFetch';

// export const uploadPostData = async (params: ContentData) => {
//   const result = await fetchPostCall(postUrlApi.uploadPostData, params);
//   return result;
// };



export const getUserDetails = async () => {
  const uri = `${getUrlApi.getUserDetails}`;
  const result = await fetchGetCall(uri);
  return result;
};

