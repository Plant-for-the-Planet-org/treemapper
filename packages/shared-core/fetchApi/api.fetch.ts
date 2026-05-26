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

export const getMyAdminWorkspaces = async (token: string) => {
  const uri = `${getUrlApi.getMyAdminWorkspaces}`
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

export const getProjectAnalytics = async (token: string, id: string) => {
  const uri = `${getUrlApi.getProjectAnalytics}/${id}/leaderboard`
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

export const createCustomBulkIntervention = async (token: string, params: any, prjId: string) => {
  const uri = `${postUrlApi.createNewIntervention}/${prjId}/custom-bulk`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};



export const updateInterventionSpecies = async (token: string, params: any, project, intervention, species) => {
  const uri = `${putUrlApi.speicesDataUpdate}/${intervention}/${project}/${species}`
  const result = await fetchPutCall(uri, params, token)
  return result
}

export const bulkUpdateInterventionSpecies = async (
  token: string,
  projectId: string,
  payload: {
    interventionUids: string[];
    sourceIsUnknown: boolean;
    sourceScientificSpeciesId?: number;
    sourceScientificSpeciesUid?: string;
    sourceSpeciesName?: string;
    targetScientificSpeciesId?: number;
    targetScientificSpeciesUid?: string;
    targetIsUnknown?: boolean;
    targetSpeciesName?: string;
    targetCommonName?: string;
    targetSpeciesCount?: number;
  },
) => {
  const uri = `${putUrlApi.bulkUpdateSpecies}/${projectId}/species/bulk`
  const result = await fetchPutCall(uri, payload, token)
  return result
}

export const bulkUpdateInterventionStartDate = async (
  token: string,
  projectId: string,
  payload: {
    interventionUids: string[];
    interventionStartDate: string;
  },
) => {
  const uri = `${putUrlApi.bulkUpdateSpecies}/${projectId}/start-date/bulk`
  const result = await fetchPutCall(uri, payload, token)
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



export const getAllMapInterevntions = async (token: string, pid: string) => {
  const uri = `${getUrlApi.getProjectMap}/${pid}/map/all`
  const result = await fetchGetCall(uri, token)
  return result
}

export const getAllTreeInterevntions = async (token: string, pid: string) => {
  const uri = `${getUrlApi.getDashboardKpis}/${pid}/map/tree`
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

export const getProjectImages = async (token: string, projectUid: string) => {
  const uri = `${getUrlApi.getProjectImages}/${projectUid}/images`;
  const result = await fetchGetCall(uri, token);
  return result;
};

export const addProjectImage = async (token: string, projectUid: string, params: { filename: string; originalName?: string; mimeType?: string }) => {
  const uri = `${postUrlApi.addProjectImage}/${projectUid}/images`;
  const result = await fetchPostCall(uri, params, token);
  return result;
};

export const deleteProjectImage = async (token: string, projectUid: string, imageUid: string) => {
  const uri = `${deleteUrlApi.deleteProjectImage}/${projectUid}/images/${imageUid}`;
  const result = await fetchDeleteCall(uri, token);
  return result;
};



export const updateUserRole = async (token: string, prjId: string, memberId: string, params: any) => {
  const uri = `${patchUrlApi.updateMemeberRole}/${prjId}/members/${memberId}/role`;
  const result = await fetchPatchCall(uri, params, token);
  return result;
};

export const updateMemberExtraPermissions = async (token: string, prjId: string, memberId: string, extraPermissions: string[]) => {
  const uri = `${patchUrlApi.updateMemeberRole}/${prjId}/members/${memberId}/extra-permissions`;
  const result = await fetchPatchCall(uri, { extraPermissions }, token);
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

export const getWorkspaceMembersApi = async (token: string, uid: string) => {
  const uri = `${getUrlApi.getWorkspaceMembers}/${uid}/members`;
  return await fetchGetCall(uri, token);
};

export const getWorkspace = async (token: string, uid: string) => {
  const uri = `${getUrlApi.getWorkspace}/${uid}`;
  const result = await fetchGetCall(uri, token);
  return result;
};

export const updateWorkspace = async (token: string, uid: string, data: object) => {
  const uri = `${patchUrlApi.updateWorkspace}/${uid}`;
  const result = await fetchPatchCall(uri, data, token);
  return result;
};

export const getWorkspaceAuditLogs = async (
  token: string,
  uid: string,
  params: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
  } = {},
) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.set(k, String(v));
  });
  const qs = query.toString();
  const uri = `${getUrlApi.getWorkspaceAuditLogs}/${uid}${qs ? `?${qs}` : ''}`;
  return await fetchGetCall(uri, token);
};

export const getWorkspaceSettings = async (token: string, uid: string) => {
  const uri = `${getUrlApi.getWorkspaceSettings}/${uid}/settings`;
  return await fetchGetCall(uri, token);
};

export const updateWorkspaceSettings = async (token: string, uid: string, data: object) => {
  const uri = `${patchUrlApi.updateWorkspaceSettings}/${uid}/settings`;
  return await fetchPatchCall(uri, data, token);
};

export const getWorkspaceProjectsApi = async (token: string, uid: string) => {
  const uri = `${getUrlApi.getWorkspaceProjects}/${uid}/projects`;
  return await fetchGetCall(uri, token);
};

export const getAllWorkspacesApi = async (token: string) => {
  const uri = `${getUrlApi.getAllWorkspaces}`;
  return await fetchGetCall(uri, token);
};

export const transferProjectApi = async (
  token: string,
  workspaceUid: string,
  projectUid: string,
  targetWorkspaceUid: string,
) => {
  const uri = `${patchUrlApi.transferProject}/${workspaceUid}/projects/${projectUid}/transfer`;
  return await fetchPatchCall(uri, { targetWorkspaceUid }, token);
};

export const updateProjectStatusApi = async (
  token: string,
  workspaceUid: string,
  projectUid: string,
  status: 'active' | 'in_review' | 'suspended' | 'disabled',
) => {
  const uri = `${patchUrlApi.updateProjectStatus}/${workspaceUid}/projects/${projectUid}/status`;
  return await fetchPatchCall(uri, { status }, token);
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

export const editIntervention = async (token: string, param: any, ) => {
  const uri = `${putUrlApi.editIntervention}/${param.interventionUid}/${param.prjid}`;
  const result = await fetchPutCall(uri, param, token);
  return result;
};

/**
 * Comprehensive edit intervention
 * Handles: dates, description, geometry, species, image, site
 */
export const editInterventionComprehensive = async (
  token: string,
  interventionUid: string,
  projectId: string,
  editData: {
    interventionStartDate?: string;
    interventionEndDate?: string;
    description?: string;
    geometry?: any;
    species?: Array<{
      uid?: string;
      scientificSpeciesId?: number;
      isUnknown: boolean;
      speciesName?: string;
      commonName?: string;
      speciesCount: number;
      action: 'add' | 'update' | 'remove';
      reassignToSpeciesUid?: string;
    }>;
    image?: string | null;
    siteUid?: string | null;
  }
) => {
  const uri = `${putUrlApi.editIntervention}/${interventionUid}/${projectId}/edit`;
  const result = await fetchPutCall(uri, editData, token);
  return result;
};

/**
 * Pre-validate intervention edit without making changes
 * Returns validation errors for frontend preview
 */
export const preValidateInterventionEdit = async (
  token: string,
  interventionUid: string,
  projectId: string,
  editData: {
    interventionStartDate?: string;
    interventionEndDate?: string;
    description?: string;
    geometry?: any;
    species?: Array<{
      uid?: string;
      scientificSpeciesId?: number;
      isUnknown: boolean;
      speciesName?: string;
      commonName?: string;
      speciesCount: number;
      action: 'add' | 'update' | 'remove';
      reassignToSpeciesUid?: string;
    }>;
    image?: string | null;
    siteUid?: string | null;
  }
) => {
  const uri = `${putUrlApi.editIntervention}/${interventionUid}/${projectId}/edit/validate`;
  const result = await fetchPostCall(uri, editData, token);
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

// Approval Board APIs - New Backend Structure
export const getReviewQueue = async (
  token: string,
  projectId: string,
  query?: {
    limit?: number;
    page?: number;
    status?: string;
    search?: string;
    sortOrder?: 'asc' | 'desc';
    sortBy?: 'submittedAt' | 'updatedAt' | 'createdAt';
  }
) => {
  const queryParams = new URLSearchParams();
  if (query?.limit) queryParams.append('limit', query.limit.toString());
  if (query?.page) queryParams.append('page', query.page.toString());
  if (query?.status) queryParams.append('status', query.status);
  if (query?.search) queryParams.append('search', query.search);
  if (query?.sortOrder) queryParams.append('sortOrder', query.sortOrder);
  if (query?.sortBy) queryParams.append('sortBy', query.sortBy);

  const queryString = queryParams.toString();
  const uri = queryString
    ? `${getUrlApi.getReviewQueue}/${projectId}/queue?${queryString}`
    : `${getUrlApi.getReviewQueue}/${projectId}/queue`;
  const result = await fetchGetCall(uri, token);
  return result;
};

export const getInterventionReviewDetails = async (
  token: string,
  interventionUid: string
) => {
  const uri = `${getUrlApi.getInterventionReviewDetails}/${interventionUid}`;
  const result = await fetchGetCall(uri, token);
  return result;
};

export const getInterventionThreads = async (
  token: string,
  interventionUid: string,
  query?: {
    limit?: number;
    page?: number;
    status?: 'open' | 'resolved' | 'closed';
  }
) => {
  const queryParams = new URLSearchParams();
  if (query?.limit) queryParams.append('limit', query.limit.toString());
  if (query?.page) queryParams.append('page', query.page.toString());
  if (query?.status) queryParams.append('status', query.status);

  const queryString = queryParams.toString();
  const uri = queryString
    ? `${getUrlApi.getInterventionThreads}/${interventionUid}/threads?${queryString}`
    : `${getUrlApi.getInterventionThreads}/${interventionUid}/threads`;
  const result = await fetchGetCall(uri, token);
  return result;
};

export const getCurrentThread = async (
  token: string,
  interventionUid: string
) => {
  const uri = `${getUrlApi.getCurrentThread}/${interventionUid}/threads/current`;
  const result = await fetchGetCall(uri, token);
  return result;
};

export const getThreadComments = async (token: string, threadUid: string) => {
  const uri = `${getUrlApi.getThreadComments}/${threadUid}/comments`;
  const result = await fetchGetCall(uri, token);
  return result;
};

export const submitForReview = async (
  token: string,
  interventionUid: string,
  dto: { note?: string }
) => {
  const uri = `${postUrlApi.submitForReview}/${interventionUid}/submit`;
  const result = await fetchPostCall(uri, dto, token);
  return result;
};

export const resubmitForReview = async (
  token: string,
  interventionUid: string,
  dto: { note?: string }
) => {
  const uri = `${postUrlApi.resubmitForReview}/${interventionUid}/resubmit`;
  const result = await fetchPostCall(uri, dto, token);
  return result;
};

export const submitReviewDecision = async (
  token: string,
  projectId: string,
  interventionUid: string,
  dto: {
    decision: 'approved' | 'changes_requested' | 'rejected';
    note?: string;
    issues?: Array<{
      field: string;
      severity: 'error' | 'warning' | 'suggestion';
      message: string;
    }>;
  }
) => {
  const uri = `${postUrlApi.submitReviewDecision}/${projectId}/interventions/${interventionUid}/review`;
  const result = await fetchPostCall(uri, dto, token);
  return result;
};

export const publishIntervention = async (
  token: string,
  projectId: string,
  interventionUid: string,
  dto: { note?: string }
) => {
  const uri = `${postUrlApi.publishIntervention}/${projectId}/interventions/${interventionUid}/publish`;
  const result = await fetchPostCall(uri, dto, token);
  return result;
};

export const unpublishIntervention = async (
  token: string,
  projectId: string,
  interventionUid: string,
  dto: { reason: string; createReviewThread?: boolean }
) => {
  const uri = `${postUrlApi.unpublishIntervention}/${projectId}/interventions/${interventionUid}/unpublish`;
  const result = await fetchPostCall(uri, dto, token);
  return result;
};

export const addAdminComment = async (
  token: string,
  projectId: string,
  threadUid: string,
  dto: {
    type: 'general' | 'issue' | 'question' | 'response' | 'resolution';
    message: string;
    parentCommentId?: number;
    targetField?: string;
    targetEntityType?: 'intervention' | 'tree' | 'image';
    targetEntityUid?: string;
    severity?: 'error' | 'warning' | 'suggestion';
  }
) => {
  const uri = `${postUrlApi.addAdminComment}/${projectId}/threads/${threadUid}/comments`;
  const result = await fetchPostCall(uri, dto, token);
  return result;
};

export const addFieldWorkerComment = async (
  token: string,
  threadUid: string,
  dto: {
    type: 'general' | 'issue' | 'question' | 'response' | 'resolution';
    message: string;
    parentCommentId?: number;
    targetField?: string;
    targetEntityType?: 'intervention' | 'tree' | 'image';
    targetEntityUid?: string;
    severity?: 'error' | 'warning' | 'suggestion';
  }
) => {
  const uri = `${postUrlApi.addFieldWorkerComment}/${threadUid}/comments`;
  const result = await fetchPostCall(uri, dto, token);
  return result;
};

export const markIssueAddressed = async (
  token: string,
  commentUid: string,
  dto: { note?: string }
) => {
  const uri = `${postUrlApi.markIssueAddressed}/${commentUid}/addressed`;
  const result = await fetchPostCall(uri, dto, token);
  return result;
};

export const resolveIssue = async (
  token: string,
  projectId: string,
  commentUid: string,
  dto: { note?: string }
) => {
  const uri = `${postUrlApi.resolveIssue}/${projectId}/comments/${commentUid}/resolve`;
  const result = await fetchPostCall(uri, dto, token);
  return result;
};

export const getUserReviewSummary = async (token: string) => {
  const uri = `${getUrlApi.getUserReviewSummary}`;
  const result = await fetchGetCall(uri, token);
  return result;
};

// Check if project requires approval workflow
export const checkProjectRequiresApproval = async (
  token: string,
  projectId: string
) => {
  const uri = `${getUrlApi.getProjectRequiresApproval}/${projectId}/requires-approval`;
  const result = await fetchGetCall(uri, token);
  return result;
};

// ========== Site Approval APIs ==========

export const getSiteReviewQueue = async (
  token: string,
  projectId: string,
  query?: { limit?: number; page?: number; status?: string; search?: string }
) => {
  const queryParams = new URLSearchParams();
  if (query?.limit) queryParams.append('limit', query.limit.toString());
  if (query?.page) queryParams.append('page', query.page.toString());
  if (query?.status) queryParams.append('status', query.status);
  if (query?.search) queryParams.append('search', query.search);
  const queryString = queryParams.toString();
  const uri = queryString
    ? `${getUrlApi.getSiteReviewQueue}/${projectId}/sites/queue?${queryString}`
    : `${getUrlApi.getSiteReviewQueue}/${projectId}/sites/queue`;
  return fetchGetCall(uri, token);
};

export const getCurrentSiteThread = async (token: string, siteUid: string) => {
  const uri = `${getUrlApi.getCurrentSiteThread}/${siteUid}/threads/current`;
  return fetchGetCall(uri, token);
};

export const submitSiteReviewDecision = async (
  token: string,
  projectId: string,
  siteUid: string,
  dto: { decision: 'in_review' | 'approved' | 'rejected'; note?: string }
) => {
  const uri = `${postUrlApi.submitSiteReviewDecision}/${projectId}/sites/${siteUid}/review`;
  return fetchPostCall(uri, dto, token);
};

export const addAdminSiteComment = async (
  token: string,
  projectId: string,
  siteUid: string,
  dto: { type: 'general' | 'issue' | 'question' | 'response' | 'resolution'; message: string }
) => {
  const uri = `${postUrlApi.addAdminSiteComment}/${projectId}/sites/${siteUid}/comment`;
  return fetchPostCall(uri, dto, token);
};

export const addFieldWorkerSiteComment = async (
  token: string,
  siteUid: string,
  dto: { type: 'general' | 'issue' | 'question' | 'response' | 'resolution'; message: string }
) => {
  const uri = `${postUrlApi.addFieldWorkerSiteComment}/${siteUid}/comment`;
  return fetchPostCall(uri, dto, token);
};

export const getWorkspaceReviewQueue = async (
  token: string,
  workspaceUid: string,
  query?: { limit?: number; page?: number; status?: string; search?: string }
) => {
  const queryParams = new URLSearchParams();
  if (query?.limit) queryParams.append('limit', query.limit.toString());
  if (query?.page) queryParams.append('page', query.page.toString());
  if (query?.status) queryParams.append('status', query.status);
  if (query?.search) queryParams.append('search', query.search);
  const queryString = queryParams.toString();
  const uri = queryString
    ? `${getUrlApi.getWorkspaceReviewQueue}/${workspaceUid}/queue?${queryString}`
    : `${getUrlApi.getWorkspaceReviewQueue}/${workspaceUid}/queue`;
  return fetchGetCall(uri, token);
};

export const getWorkspaceSiteReviewQueue = async (
  token: string,
  workspaceUid: string,
  query?: { limit?: number; page?: number; status?: string; search?: string }
) => {
  const queryParams = new URLSearchParams();
  if (query?.limit) queryParams.append('limit', query.limit.toString());
  if (query?.page) queryParams.append('page', query.page.toString());
  if (query?.status) queryParams.append('status', query.status);
  if (query?.search) queryParams.append('search', query.search);
  const queryString = queryParams.toString();
  const uri = queryString
    ? `${getUrlApi.getWorkspaceSiteReviewQueue}/${workspaceUid}/sites/queue?${queryString}`
    : `${getUrlApi.getWorkspaceSiteReviewQueue}/${workspaceUid}/sites/queue`;
  return fetchGetCall(uri, token);
};

// Legacy functions for backward compatibility (can be removed later)
export const getApprovalBoard = getReviewQueue;
export const moveInterventionStatus = submitReviewDecision;
export const addApprovalComment = addFieldWorkerComment;


export const editTree = async (
  token: string,
  treeHid: string,
  projectId: string,
  editData: {
    tag?: string;
    height?: number;
    width?: number;
    plantingDate?: string;
    location?: any;
    image?: string | null;
    species?: {
      scientificSpeciesId: number;
      scientificSpeciesUid?: string;
      speciesName: string;
      commonName?: string;
      interventionSpeciesUid: string;
    };
    speciesCount?: number;
  }
) => {
  const uri = `${putUrlApi.editTree}/${treeHid}/${projectId}/edit`;
  const result = await fetchPutCall(uri, editData, token);
  return result;
};

export const getTreeRecords = async (
  token: string,
  treeHid: string,
  projectId: string,
) => {
  const uri = `${getUrlApi.getTreeRecords}/${treeHid}/${projectId}/records`;
  return fetchGetCall(uri, token);
};

export const addTreeRemeasurement = async (
  token: string,
  treeHid: string,
  projectId: string,
  data: {
    status: 'alive' | 'dead';
    height?: number;
    width?: number;
    notes?: string;
    image?: string;
    recordedAt?: string;
  }
) => {
  const uri = `${putUrlApi.addTreeRemeasurement}/${treeHid}/${projectId}/remeasure`;
  const result = await fetchPostCall(uri, data, token);
  return result;
};
