const baseUrl = process.env.EXPO_PUBLIC_API_ENDPOINT
const mobileBaseUrl = process.env.EXPO_PUBLIC_API_ENDPOINT_MOBILE


export const postUrlApi = {
  updateSpecies: `${baseUrl}/treemapper/species`,
  addUserSpecies: `${baseUrl}/treemapper/species`,

  deleteAccount: `${baseUrl}/app/profile`,
};

export const getUrlApi = {
  getBaseUrl: `${baseUrl}`,

  userSpecies: `${baseUrl}/treemapper/species`,

  getAreaName: `https://api.mapbox.com/geocoding/v5/mapbox.places`,
  getAllSpeciesAchieve: `${baseUrl}/treemapper/scientificSpeciesArchive`,

};



export const postUrlNewApi = {
  uploadMobileIntervention: `${mobileBaseUrl}/mobile/project`,
  recordPlannedIntervention: `${mobileBaseUrl}/mobile/project`,
  createNewProject: `${mobileBaseUrl}/mobile/project`,
  createSite: `${mobileBaseUrl}/mobile/site`,
  uploadImageData: `${mobileBaseUrl}/mobile/image`,
  awsSignedUrl: `${mobileBaseUrl}/mobile/signedurl`,
  interventionImage: `${mobileBaseUrl}/mobile/intervention/image`,
  remeasurement: `${mobileBaseUrl}/mobile/intervention`,
  deleteIntervention: `${mobileBaseUrl}/mobile/delete/intervention`,
  acceptEmailInvite: `${mobileBaseUrl}/mobile/invites/accept`,
  acceptBulkInvite: `${mobileBaseUrl}/mobile/invites/accept/link`,
  registerDevice: `${mobileBaseUrl}/users/devices`,
  submitFeedback: `${mobileBaseUrl}/mobile/feedback`,
};

export const getUrlMobileApi = {
  
  getMobileHealth: `${mobileBaseUrl}/health`,
  getUserDetails: `${mobileBaseUrl}/mobile/user/profile`,
  getAllMobileProjects: `${mobileBaseUrl}/mobile/user/projects`,
  getPersonalProject: `${mobileBaseUrl}/mobile/user/personal-project`,
  getProjectSpecies: `${mobileBaseUrl}/mobile/species`,
  getMobileInterventions: `${mobileBaseUrl}/mobile/project/interventions`,
  getMobileEmailInviteStatus: `${mobileBaseUrl}/mobile/invites`,
  getMobileaLinkInviteStatus: `${mobileBaseUrl}/mobile/invites`,
  getNotifications: `${mobileBaseUrl}/mobile/notifications`,
  getUnreadNotificationCount: `${mobileBaseUrl}/mobile/notifications/unread-count`,
  getSingleIntervention: `${mobileBaseUrl}/mobile/intervention`,
};


