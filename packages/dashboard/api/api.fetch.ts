import { getUrlApi, postUrlApi } from './api.url'
import {
  fetchDeleteCall,
  fetchGetCall,
  fetchPostCall,
  fetchPutCall,
} from './customFetch'

export const healthCheck = async () => {
  const uri = `${getUrlApi.health}`
  const result = await fetchGetCall(uri)
  return result
}

export const getUserDetails = async (token: string) => {
  const uri = `${getUrlApi.me}`
  const result = await fetchGetCall(uri, token)
  return result
}


export const createNewProject = async (token: string, params: any) => {
  const uri = `${postUrlApi.createProject}`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};


export const getUserProjects = async (token: string) => {
  const uri = `${getUrlApi.projects}`
  const result = await fetchGetCall(uri, token)
  return result
}