import { getUrlApi, postUrlApi } from './api.url';
import { fetchGetCall, fetchPostCall } from './customFetch';

export const uploadIntervention = async (params: any) => {
  const result = await fetchPostCall(postUrlApi.uploadIntervention, params);
  return result;
};

// export const uploadInterventionImage = async (body: any) => {
//   const result = await fetchPostCall(`${postUrlApi.uploadInterventionImage}/${body.locationId}/coordinates/${body.imageId}`, { "imageFile": body.imageFile });
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


export const getAreaName = async (coords: number[],) => {
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

export const getServerIntervention = async (uri: string) => {
  const result = await fetchGetCall(uri);
  return result;
};

export const getUserSpecies = async () => {
  const uri = `${getUrlApi.userSpecies}`;
  const result = await fetchGetCall(uri);
  return result;
};
