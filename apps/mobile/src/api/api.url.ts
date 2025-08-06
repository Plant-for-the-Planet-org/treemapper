const baseUrl = '192.168.0.103:3001/api'

const https = 'http://'

export const postUrlApi = {
  uploadIntervention: `${https}${baseUrl}/treemapper/interventions`,
  imageUpload: `${https}${baseUrl}/treemapper/interventions`,
  remeasurement: `${https}${baseUrl}/treemapper/interventions`,
  skipRemeasurement: `${https}${baseUrl}/treemapper/interventions`,
  updateSpecies: `${https}${baseUrl}/treemapper/species`,
  addUserSpecies: `${https}${baseUrl}/treemapper/species`,
  updatePlantLocationData: `${https}${baseUrl}/treemapper/interventions`,
  signupService: `${https}${baseUrl}/app/profile`,
  updateProjectInF: `${https}${baseUrl}/app/projects`,
  createNewSite: `${https}${baseUrl}/app/projects`,
  deleteAccount: `${https}${baseUrl}/app/profile`,
};

export const getUrlApi = {
  getBaseUrl: `${https}${baseUrl}`,
  getBaseTestUrl: `${https}${baseUrl}`,
  getUserDetails: `${https}${baseUrl}/app/profile`,
  getAllPlantLocations: `${https}${baseUrl}/treemapper/interventions?limit=4&_scope=extended`,
  getAllProjects: `${https}${baseUrl}/app/profile/projects?_scope=extended`,
  userSpecies: `${https}${baseUrl}/treemapper/species`,
  getAreaName: `https://api.mapbox.com/geocoding/v5/mapbox.places`,
  getSingleLocationDetail: `${https}${baseUrl}/treemapper/plantLocations`,
  getAllSpeciesAchieve: `${https}${baseUrl}/treemapper/scientificSpeciesArchive`,
  getNecessaryInventoryFromServer: "/treemapper/plantLocations?limit=4&filter=revision-pending&_scope=extended",
};



export const postUrlNewApi = {
  uploadMobileIntervention: `${https}${baseUrl}/mobile/project`,
  // imageUpload: `${https}${baseUrl}/treemapper/interventions`,
  // remeasurement: `${https}${baseUrl}/treemapper/interventions`,
  // skipRemeasurement: `${https}${baseUrl}/treemapper/interventions`,
  // updateSpecies: `${https}${baseUrl}/treemapper/species`,
  // addUserSpecies: `${https}${baseUrl}/treemapper/species`,
  // updatePlantLocationData: `${https}${baseUrl}/treemapper/interventions`,
  // signupService: `${https}${baseUrl}/app/profile`,
  // updateProjectInF: `${https}${baseUrl}/app/projects`,
  // createNewSite: `${https}${baseUrl}/app/projects`,
  // deleteAccount: `${https}${baseUrl}/app/profile`,
};

export const getUrlMobileApi = {
  getMobileHealth: `${https}${baseUrl}/mobile/health`,
  getUserDetails: `${https}${baseUrl}/mobile/user/profile`,
  // userSpecies: `${https}${baseUrl}/mobile/user/species`,
  getAllMobileProjects: `${https}${baseUrl}/mobile/user/projects`,

  // getBaseUrl: `${https}${baseUrl}`,
  // getBaseTestUrl: `${https}${baseUrl}`,
  // getAllPlantLocations: `${https}${baseUrl}/treemapper/interventions?limit=4&_scope=extended`,
  // getAreaName: `https://api.mapbox.com/geocoding/v5/mapbox.places`,
  // getSingleLocationDetail: `${https}${baseUrl}/treemapper/plantLocations`,
  // getAllSpeciesAchieve: `${https}${baseUrl}/treemapper/scientificSpeciesArchive`,
  // getNecessaryInventoryFromServer: "/treemapper/plantLocations?limit=4&filter=revision-pending&_scope=extended",
};


