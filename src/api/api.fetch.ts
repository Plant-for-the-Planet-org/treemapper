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


export const getAllProjects = async () => {
  const uri = `${getUrlApi.getAllProjects}`;
  const result = await fetchGetCall(uri);
  return result;
};


export const getAreaName=async(coords:number[],)=>{
  const uri = `${getUrlApi.getAreaName}/${coords[0]},${coords[1]}.json?types=place&access_token=${process.env.EXPO_PUBLIC_MAPBOX_TOKEN}`
  try {
    const response = await fetch(`${uri}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const responseJson = await response.json()
    return responseJson
  } catch (err) {
    return false
  }
}
