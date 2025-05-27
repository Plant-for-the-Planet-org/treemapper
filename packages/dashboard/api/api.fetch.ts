import { getUrlApi, postUrlApi, patchUrlApi } from './api.url'
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

export const getMyDetails = async (token: string) => {
  const uri = `${getUrlApi.me}`
  const result = await fetchGetCall(uri, token)
  return result
}


export const checkForMigration = async (token: string) => {
  const uri = `${getUrlApi.checkMigration}`
  const result = await fetchGetCall(uri, token)
  return result
}

export const createNewProject = async (token: string, params: any) => {
  const uri = `${postUrlApi.createProject}`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};

export const acceptProjectInvite = async (token: string, params: any) => {
  const uri = `${postUrlApi.acceptInvite}`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};

export const declineProjectInvite = async (token: string, params: any) => {
  const uri = `${postUrlApi.declineInvite}`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};



export const getMyProjects = async (token: string) => {
  const uri = `${getUrlApi.projects}`
  const result = await fetchGetCall(uri, token)
  return result
}

export const getInviteStatus = async (token: string, uuid: string) => {
  const uri = `${getUrlApi.inviteStatus}/${uuid}/status`
  const result = await fetchGetCall(uri, token)
  return result
}



export const createProjectInvite = async (token: string, project_id: string, params: any) => {
  const uri = `${postUrlApi.createProjectinvite}/${project_id}/invites`
  const result = await fetchPostCall(uri, params, token);
  return result;
};


export const updateUserMigrate = async (token: string, params: any) => {
  const uri = `${patchUrlApi.userMigrated}`;
  const result = await fetchPutCall(uri, params, token);
  return result;
};
