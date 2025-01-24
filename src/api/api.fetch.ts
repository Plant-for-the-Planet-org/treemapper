import { getUrlApi, postUrlApi } from './api.url';
import { fetchDeleteCall, fetchGetCall, fetchPostCall, fetchPutCall } from './customFetch';

export const uploadIntervention = async (params: any) => {
  const uri = `${postUrlApi.uploadIntervention}`;
  const result = await fetchPostCall(uri, params);
  return result;
};

export const uploadInterventionImage = async (location_id: string, coordinate_id: string, params: any) => {
  const uri = `${postUrlApi.imageUpload}/${location_id}/coordinates/${coordinate_id}`
  const result = await fetchPutCall(uri, params);
  return result;
};

export const remeasurement = async (tree_id: string, params: any) => {
  const uri = `${postUrlApi.remeasurement}/${tree_id}/event`
  const result = await fetchPostCall(uri, params);
  return result;
};

export const deleteAccount = async () => {
  const uri = `${postUrlApi.deleteAccount}`
  const result = await fetchDeleteCall(uri);
  return result;
};


export const skipRemeasurement = async (tree_id: string, params: any) => {
  const uri = `${postUrlApi.skipRemeasurement}/${tree_id}/event`
  const result = await fetchPostCall(uri, params);
  return result;
};

export const getUserDetails = async () => {
  const uri = `${getUrlApi.getUserDetails}`;
  const result = await fetchGetCall(uri, true);
  return result;
};


export const getAllProjects = async () => {
  const uri = `${getUrlApi.getAllProjects}`;
  const result = await fetchGetCall(uri, true);
  return result;
};


export const getAreaName = async (coords: number[],) => {
  const uri = `${getUrlApi.getAreaName}/${coords[0]},${coords[1]}.json?types=place&access_token=${process.env.EXPO_PUBLIC_MAP_BOX_TOKEN}`
  const result = await fetchGetCall(uri, false);
  return result;
}

export const getUserSpecies = async () => {
  const uri = `${getUrlApi.userSpecies}`;
  const result = await fetchGetCall(uri, true);
  return result;
};

export const getAllSpeciesAchieve = async () => {
  const uri = `${getUrlApi.getAllSpeciesAchieve}`;
  const result = await fetchGetCall(uri, false);
  return result;
};

export const getServerIntervention = async (uri?: string) => {
  const url = uri.length > 0 ? `${getUrlApi.getBaseTestUrl}/${uri}` : getUrlApi.getAllPlantLocations
  const result = await fetchGetCall(url, true);
  return result;
};


export const createUserProfile = async (params: any) => {
  const uri = `${postUrlApi.signupService}`;
  const result = await fetchPostCall(uri, params, false);
  return result;
};

export const updateProjectDetails = async (d: { i: number, f: string, id: string }) => {
  const uri = `${postUrlApi.updateProjectInF}/${d.id}`;
  const result = await fetchPutCall(uri, {
    "revisionPeriodicityLevel": d.f,
    "intensity": d.i
  });
  return result;
};

export const addUserSpeciesToServer = async (params: any) => {
  const uri = `${postUrlApi.addUserSpecies}`;
  const result = await fetchPostCall(uri, params);
  return result;
};


export const removeUserSpeciesToServer = async (id: any) => {
  const uri = `${postUrlApi.addUserSpecies}/${id}`;
  const result = await fetchDeleteCall(uri);
  return result;
};


export const updateServerSpeciesDetail = async (params: any, id: string) => {
  const uri = `${postUrlApi.addUserSpecies}/${id}`;
  const result = await fetchPutCall(uri, params);
  return result;
};


export const createNewSite = async (pid: string, params: any) => {
  const uri = `${postUrlApi.createNewSite}/${pid}/sites`
  const result = await fetchPostCall(uri, params);
  return result;
};

export const uploadPlotData = async (params: any) => {
  const uri = `${postUrlApi.createPlot}`;
  const result = await fetchPostCall(uri, params);
  return result;
};

export const uploadPlotIntervention = async (params: any, plotId) => {
  const uri = `${postUrlApi.plotBaseUrl}/${plotId}/interventions`;
  const result = await fetchPostCall(uri, params);
  return result;
};

export const uploadPlotObservation = async (params: any, obsId) => {
  const uri = `${postUrlApi.plotBaseUrl}/${obsId}/observations`;
  const result = await fetchPostCall(uri, params);
  return result;
};