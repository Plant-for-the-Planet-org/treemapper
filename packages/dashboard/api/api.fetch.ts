import { getUrlApi, postUrlApi, patchUrlApi, deleteUrlApi, putUrlApi } from './api.url'
import {
  fetchDeleteCall,
  fetchGetCall,
  fetchPatchCall,
  fetchPostCall,
  fetchPutCall,
} from './customFetch'


//app
export const healthCheck = async () => {
  const uri = `${getUrlApi.health}`
  const result = await fetchGetCall(uri)
  return result
}


//user
export const getMyDetails = async (token: string) => {
  const uri = `${getUrlApi.me}`
  const result = await fetchGetCall(uri, token)
  return result
}


//migrate

export const checkForMigration = async (token: string) => {
  const uri = `${getUrlApi.checkMigration}`
  const result = await fetchGetCall(uri, token)
  return result
}

export const checkMigrationStatusBackend = async (token: string) => {
  const uri = `${getUrlApi.migrationStatus}`
  const result = await fetchGetCall(uri, token)
  return result
}

export const startMigrationBackend = async (token: string, params: any) => {
  const uri = `${postUrlApi.startMigration}`;
  const result = await fetchPostCall(uri, params, token);
  return result;
}



//Project
export const createNewProject = async (token: string, params: any) => {
  const uri = `${postUrlApi.createProject}`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};

export const createNewPersonalProject = async (token: string, params: any,) => {
  const uri = `${postUrlApi.createPersonalProject}`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};

export const getTeamMemebers = async (token: string, id: string) => {
  const uri = `${getUrlApi.teamMembers}/${id}/allmembers`
  const result = await fetchGetCall(uri, token)
  return result
}


export const getMyProjects = async (token: string) => {
  const uri = `${getUrlApi.projects}`
  const result = await fetchGetCall(uri, token)
  return result
}

//inivte
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

export const expireInvite = async (token: string, params: any, pid: string) => {
  const uri = `${postUrlApi.expireInvite}/${pid}/invites/expire`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};




//species
export const getSciencetificSpecies = async (token: string, search: string) => {
  const uri = `${getUrlApi.searchSpeciesSci}?name=${search}`
  const result = await fetchGetCall(uri, token)
  return result
}

export const getProjectSpecies = async (token: string, prjId: string) => {
  const uri = `${getUrlApi.projectSpecies}/${prjId}`
  const result = await fetchGetCall(uri, token)
  return result
}

export const createNewProjectSpecies = async (token: string, params: any, prjId: string) => {
  const uri = `${postUrlApi.createProjectSpecies}/${prjId}`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};

export const requestNewSpecies = async (token: string, params: any, prjId: string) => {
  const uri = `${postUrlApi.requestNewSpecies}/${prjId}`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};



//sites

export const getUserProjectSites = async (token: string, id: string) => {
  const uri = `${getUrlApi.getProjectSites}/${id}/sites`
  const result = await fetchGetCall(uri, token)
  return result
}

export const createNewDashboardSite = async (token: string, params: any, prjId: string) => {
  const uri = `${postUrlApi.createNewDashboardSite}/${prjId}/sites`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};




//intervention



export const createNewIntervention = async (token: string, params: any, prjId: string) => {
  const uri = `${postUrlApi.createNewIntervention}/${prjId}`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};




















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


export const removeProjectMember = async (token: string, projectGuiD: string, memberGuid: string) => {
  const uri = `${deleteUrlApi.removeUser}/${projectGuiD}/members/${memberGuid}`;
  const result = await fetchDeleteCall(uri, token);
  return result;
};


export const updateUserRole = async (token: string, prjId: string, memberId: string, params: any) => {
  const uri = `${patchUrlApi.updateMemeberRole}/${prjId}/members/${memberId}/role`;
  const result = await fetchPatchCall(uri, params, token);
  return result;
};


export const updateProjectSpecies = async (token: string, params: any, prjId: string, species: string) => {
  const uri = `${putUrlApi.updatePrjSpecies}/${prjId}/species/${species}`;
  const result = await fetchPutCall(uri, params, token);
  return result;
};



export const removePrjSpecies = async (token: string, projectGuiD: string, speciesId: string) => {
  const uri = `${deleteUrlApi.deletePrjSpecies}/${projectGuiD}/species/${speciesId}`;
  const result = await fetchDeleteCall(uri, token);
  return result;
};