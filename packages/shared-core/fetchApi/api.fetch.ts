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

export const startOnboarding = async (token: string, params: any) => {
  const uri = `${postUrlApi.onboarding}`
  const result = await fetchPostCall(uri, params, token)
  return result
}

export const generatePreSignUrl = async (token: string, params: any) => {
  const uri = `${postUrlApi.preSignUrl}`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};

export const updateUserDetails = async (token: string, params: any) => {
  const uri = `${getUrlApi.me}`
  const result = await fetchPatchCall(uri, params, token)
  return result
}


export const updateUserAvatar = async (token: string, params: any) => {
  const uri = `${putUrlApi.avatarUpdate}`;
  const result = await fetchPutCall(uri, params, token);
  return result;
};




export const getAllMyOrg = async (token: string) => {
  const uri = `${getUrlApi.getMyOrgs}`
  const result = await fetchGetCall(uri, token)
  return result
}

export const createNewOrg = async (token: string, params: any) => {
  const uri = `${postUrlApi.createNewOrg}`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};

export const selectOrg = async (token: string, params: any) => {
  const uri = `${postUrlApi.selectOrg}`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};

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
export const createNewProject = async (token: string, params: any, pid: string) => {
  const uri = `${postUrlApi.createProject}/${pid}`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};

export const createNewPersonalProject = async (token: string, params: any,) => {
  const uri = `${postUrlApi.createPersonalProject}`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};


export const exportAllData = async (token: string, params: any, prid) => {
  const uri = `${postUrlApi.exportData}/${prid}/export`;
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

export const getMyProjectMember = async (token: string,projectId: string) => {
  const uri = `${getUrlApi.projectMemebers}/projectId`
  const result = await fetchGetCall(uri, token)
  return result
}


export const getMyWorkspaceProjects = async (token: string) => {
  const uri = `${getUrlApi.workspce}`
  const result = await fetchGetCall(uri, token)
  return result
}

export const getSingleProjectDetails = async (token: string, prid: string) => {
  const uri = `${getUrlApi.singleproject}/${prid}`
  const result = await fetchGetCall(uri, token)
  return result
}

//inivte
export const acceptProjectInvite = async (token: string, params: any) => {
  const uri = `${postUrlApi.acceptInvite}`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};

export const acceptLinkProjectInvite = async (token: string, params: any) => {
  const uri = `${postUrlApi.acceptlinkInvite}`;
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

export const getAllProjectInviteLink = async (token: string, id: string) => {
  const uri = `${getUrlApi.getAllInviteLinks}/${id}/links`;
  const result = await fetchGetCall(uri, token);
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

export const updateDashboardSite = async (token: string, params: any, prjId: string, site) => {
  const uri = `${putUrlApi.updateSiteData}/${prjId}/sites/${site}`;
  const result = await fetchPutCall(uri, params, token);
  return result;
};


//intervention



export const createNewIntervention = async (token: string, params: any, prjId: string) => {
  const uri = `${postUrlApi.createNewIntervention}/${prjId}/web`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};

export const getProjectIntervention = async (token: string, id: string, queryParams: any) => {
  let uri = `${getUrlApi.getProjectIntervnetion}/${id}`

  // Convert queryParams object to query string
  if (queryParams && Object.keys(queryParams).length > 0) {
    const searchParams = new URLSearchParams(queryParams);
    uri += `?${searchParams.toString()}`;
  }

  const result = await fetchGetCall(uri, token)
  return result
}


export const createBulkIntervention = async (token: string, params: any, prjId: string) => {
  const uri = `${postUrlApi.createNewIntervention}/${prjId}/bulk`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};



export const updateInterventionSpecies = async (token: string, params: any, project, intervention, species) => {
  const uri = `${putUrlApi.speicesDataUpdate}/${intervention}/${project}/${species}`
  const result = await fetchPutCall(uri, params, token)
  return result
}

export const ownerrhsipTranferCall = async (token: string, params: any, project, intervention) => {
  const uri = `${putUrlApi.ownershipTransfer}/${intervention}/${project}}/owner`
  const result = await fetchPutCall(uri, params, token)
  return result
}


//notification

export const getMyNotification = async (token: string, page: number, limit: number) => {
  const uri = `${getUrlApi.getMyNotification}?page=${page}&limit=${limit}`
  const result = await fetchGetCall(uri, token)
  return result
}


export const markNotificationRead = async (token: string) => {
  const uri = `${patchUrlApi.markAllRead}`;
  const result = await fetchPatchCall(uri, {}, token);
  return result;
};

export const markSingleNotificationRead = async (token: string, id: number) => {
  const uri = `${patchUrlApi.markRead}/${id}/read`;
  const result = await fetchPatchCall(uri, {}, token);
  return result;
};



export const updateProjectSettings = async (token: string, params, prid) => {
  const uri = `${patchUrlApi.updateProjectSettings}/${prid}`;
  const result = await fetchPatchCall(uri, params, token);
  return result;
};




export const deleteIntervention = async (token: string, prjId: string, invId: string,) => {
  const uri = `${deleteUrlApi.deletePrjIntervention}/${prjId}/${invId}`;
  const result = await fetchDeleteCall(uri, token);
  return result;
};



export const getProjectMapData = async (token: string, pid: string) => {
  const uri = `${getUrlApi.getProjectMapData}/${pid}/map`
  const result = await fetchGetCall(uri, token)
  return result
}



export const getDashboardKpis = async (token: string, pid: string) => {
  const uri = `${getUrlApi.getDashboardKpis}/${pid}`
  const result = await fetchGetCall(uri, token)
  return result
}

export const getOverviewGraph = async (token: string, pid: string, interval: string) => {
  const uri = `${getUrlApi.getOverviewGraph}/${pid}?interval=${interval}`
  const result = await fetchGetCall(uri, token)
  return result
}

export const getDashboardRecentAddition = async (token: string, pid: string, page: number, limit: number) => {
  const uri = `${getUrlApi.getDashboardRecentAddition}/${pid}?page=${page}&limit=${limit}`
  const result = await fetchGetCall(uri, token)
  return result
}




export const getInviteStatus = async (token: string, uuid: string) => {
  const uri = `${getUrlApi.inviteStatus}/${uuid}/status`
  const result = await fetchGetCall(uri, token)
  return result
}

export const getLinkInviteStatus = async (token: string, uuid: string) => {
  const uri = `${getUrlApi.inviteStatus}/${uuid}/status/link`
  const result = await fetchGetCall(uri, token)
  return result
}




export const createProjectInvite = async (token: string, project_id: string, params: any) => {
  const uri = `${postUrlApi.createProjectinvite}/${project_id}/invites`
  const result = await fetchPostCall(uri, params, token);
  return result;
};


export const createProjectInviteLink = async (token: string, project_id: string, params: any) => {
  const uri = `${postUrlApi.createProjectinvite}/${project_id}/invites/link`
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


export const deleteProject = async (token: string, projectGuiD:string) => {
  const uri = `${deleteUrlApi.deleteProject}/${projectGuiD}`;
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

export const removeInviteLink = async (token: string, projectGuiD: string, linkUid: string) => {
  const uri = `${patchUrlApi.deleteLink}/${projectGuiD}/invites/${linkUid}/link`;
  const result = await fetchPatchCall(uri, {}, token);
  return result;
};

export const updateSpciesFav = async (token: string, params: any, prjId: string, species) => {
  const uri = `${putUrlApi.updateFavSpecies}/${prjId}/species/${species}/fav`;
  const result = await fetchPutCall(uri, params, token);
  return result;
};

export const updateDisbaleSpecies = async (token: string, params: any, prjId: string, species) => {
  const uri = `${putUrlApi.updateFavSpecies}/${prjId}/species/${species}/disable`;
  const result = await fetchPutCall(uri, params, token);
  return result;
};

export const getallstieMembers = async (token: string, prjId: string, site: string) => {
  const uri = `${getUrlApi.getSiteMembers}/${prjId}/sites/${site}/members`;
  const result = await fetchGetCall(uri, token);
  return result;
};

export const getWorkspaceMembers = async (token: string) => {
  const uri = `${getUrlApi.getWrokspaceMembers}`;
  const result = await fetchGetCall(uri, token);
  return result;
};

export const startImpersonationWork = async (token: string, person: string) => {
  const uri = `${putUrlApi.impersonateUser}/${person}`;
  const result = await fetchPutCall(uri, {}, token);
  return result;
};


export const exitImpersonationWork = async (token: string) => {
  const uri = `${putUrlApi.impersonateUser}/exit`;
  const result = await fetchPutCall(uri, {}, token);
  return result;
};


export const grantSiteAccess = async (token: string, pid, siteId, memberId) => {
  const uri = `${postUrlApi.grantSiteAccess}/${pid}/sites/${siteId}/access/grant`;
  const result = await fetchPostCall(uri, { memberUid: memberId }, token);
  return result;
};


export const revokeiteAccess = async (token: string, pid, siteId, memberId) => {
  const uri = `${postUrlApi.revokeSiteAccess}/${pid}/sites/${siteId}/access/revoke`;
  const result = await fetchPostCall(uri, { memberUid: memberId }, token);
  return result;
};
