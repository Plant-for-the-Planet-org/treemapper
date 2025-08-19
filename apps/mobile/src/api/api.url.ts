const baseUrl = process.env.EXPO_PUBLIC_API_ENDPOINT
const mobileBaseUrl = process.env.EXPO_PUBLIC_API_ENDPOINT_MOBILE


export const postUrlApi = {
  uploadIntervention: `${baseUrl}/treemapper/interventions`,
  imageUpload: `${baseUrl}/treemapper/interventions`,
  remeasurement: `${baseUrl}/treemapper/interventions`,
  skipRemeasurement: `${baseUrl}/treemapper/interventions`,
  updateSpecies: `${baseUrl}/treemapper/species`,
  addUserSpecies: `${baseUrl}/treemapper/species`,
  updatePlantLocationData: `${baseUrl}/treemapper/interventions`,
  signupService: `${baseUrl}/app/profile`,
  updateProjectInF: `${baseUrl}/app/projects`,
  createNewSite: `${baseUrl}/app/projects`,
  deleteAccount: `${baseUrl}/app/profile`,
};

export const getUrlApi = {
  getBaseUrl: `${baseUrl}`,
  getBaseTestUrl: `${baseUrl}`,
  getUserDetails: `${baseUrl}/app/profile`,
  getAllPlantLocations: `${baseUrl}/treemapper/interventions?limit=4&_scope=extended`,
  getAllProjects: `${baseUrl}/app/profile/projects?_scope=extended`,
  userSpecies: `${baseUrl}/treemapper/species`,
  getAreaName: `https://api.mapbox.com/geocoding/v5/mapbox.places`,
  getSingleLocationDetail: `${baseUrl}/treemapper/plantLocations`,
  getAllSpeciesAchieve: `${baseUrl}/treemapper/scientificSpeciesArchive`,
  getNecessaryInventoryFromServer: "/treemapper/plantLocations?limit=4&filter=revision-pending&_scope=extended",
};



export const postUrlNewApi = {
  uploadMobileIntervention: `${mobileBaseUrl}/mobile/project`,
  updateUserDetails: `${mobileBaseUrl}/mobile/user/profile`,
  createNewProject: `${mobileBaseUrl}/mobile/project`,
  uploadImageData: `${mobileBaseUrl}/mobile/image`,
  awsSignedUrl: `${mobileBaseUrl}/mobile/signedurl`,
};

export const getUrlMobileApi = {
  getMobileHealth: `${mobileBaseUrl}/health`,
  getUserDetails: `${mobileBaseUrl}/mobile/user/profile`,
  getAllMobileProjects: `${mobileBaseUrl}/mobile/user/projects`,
};


