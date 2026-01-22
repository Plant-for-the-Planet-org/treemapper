const baseUrl = process.env.EXPO_PUBLIC_API_ENDPOINT
const mobileBaseUrl = process.env.EXPO_PUBLIC_API_ENDPOINT_MOBILE


export const postUrlApi = {
  uploadIntervention: `${baseUrl}/treemapper/interventions`,
  imageUpload: `${baseUrl}/treemapper/interventions`,


  remeasurement: `${baseUrl}/treemapper/interventions`,
  skipRemeasurement: `${baseUrl}/treemapper/interventions`,

  updateSpecies: `${baseUrl}/treemapper/species`,
  addUserSpecies: `${baseUrl}/treemapper/species`,
  signupService: `${baseUrl}/app/profile`,

  updateProjectInF: `${baseUrl}/app/projects`,
  createNewSite: `${baseUrl}/app/projects`,
  deleteAccount: `${baseUrl}/app/profile`,
};

export const getUrlApi = {
  getBaseUrl: `${baseUrl}`,
  getBaseTestUrl: `${baseUrl}`,
  getAllPlantLocations: `${baseUrl}/treemapper/interventions?limit=4&_scope=extended`,


  getUserDetails: `${baseUrl}/app/profile`,


  getAllProjects: `${baseUrl}/app/profile/projects?_scope=extended`,

  userSpecies: `${baseUrl}/treemapper/species`,

  getAreaName: `https://api.mapbox.com/geocoding/v5/mapbox.places`,
  getAllSpeciesAchieve: `${baseUrl}/treemapper/scientificSpeciesArchive`,

};



export const postUrlNewApi = {
  uploadMobileIntervention: `${mobileBaseUrl}/mobile/project`,
  updateUserDetails: `${mobileBaseUrl}/mobile/user/profile`,
  createNewProject: `${mobileBaseUrl}/mobile/project`,
  uploadImageData: `${mobileBaseUrl}/mobile/image`,
  awsSignedUrl: `${mobileBaseUrl}/mobile/signedurl`,
  interventionImage: `${mobileBaseUrl}/mobile/intervention/image`,
  sendFeatureRequest: `${mobileBaseUrl}/mobile/request/features`,
  remeasurement: `${mobileBaseUrl}/mobile/intervention`,
  deleteIntervention: `${mobileBaseUrl}/mobile/delete/intervention`,
  acceptEmailInvite: `${mobileBaseUrl}/mobile/invites/accept`,
  acceptBulkInvite: `${mobileBaseUrl}/mobile/invites/accept/link`,
  registerDevice: `${mobileBaseUrl}/users/devices`,
};

export const getUrlMobileApi = {
  getMobileHealth: `${mobileBaseUrl}/health`,
  getUserDetails: `${mobileBaseUrl}/mobile/user/profile`,
  getAllMobileProjects: `${mobileBaseUrl}/mobile/user/projects`,
  getProjectSpecies: `${mobileBaseUrl}/mobile/species`,
  getMobileInterventions: `${mobileBaseUrl}/mobile/project/interventions`,
  getMobileEmailInviteStatus: `${mobileBaseUrl}/mobile/invites`,
  getMobileaLinkInviteStatus: `${mobileBaseUrl}/mobile/invites`,
  getNotifications: `${mobileBaseUrl}/mobile/notifications`,
  getUnreadNotificationCount: `${mobileBaseUrl}/mobile/notifications/unread-count`,
  getSingleIntervention: `${mobileBaseUrl}/mobile/intervention`,
};


