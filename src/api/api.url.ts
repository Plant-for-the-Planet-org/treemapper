const baseUrl = process.env.EXPO_PUBLIC_API_ENDPOINT
const testingURL = process.env.EXPO_PUBLIC_TESTING_URL
const https = 'https://'

export const postUrlApi = {
  uploadIntervention: `${https}${testingURL}/treemapper/interventions`,
  imageUpload: `${https}${testingURL}/treemapper/interventions`,
  remeasurement: `${https}${testingURL}/treemapper/interventions`,
  updateSpecies:  `${https}${baseUrl}/treemapper/species`,
  addUserSpecies: `${https}${baseUrl}/treemapper/species`,
  updatePlantLocationData: `${https}${testingURL}/treemapper/interventions`,
  signupService:`${https}${baseUrl}/app/profile`,
  updateProjectInF: `${https}${baseUrl}/app/projects` //PUT `/app/projects/${projectId}`
};

export const getUrlApi = {
  getBaseUrl:  `${https}${baseUrl}`,
  getUserDetails: `${https}${baseUrl}/app/profile`,
  getAllPlantLocations: `${https}${baseUrl}/treemapper/plantLocations?limit=10&_scope=extended`,
  getAllProjects: `${https}${baseUrl}/app/profile/projects?_scope=extended`,
  userSpecies: `${https}${baseUrl}/treemapper/species`,
  getAreaName: `https://api.mapbox.com/geocoding/v5/mapbox.places`,
  getSingleLocationDetail: `${https}${baseUrl}/treemapper/plantLocations`,
  getAllSpeciesAchieve:`${https}${baseUrl}/treemapper/scientificSpeciesArchive`,
  getNecessaryInventoryFromServer:"/treemapper/plantLocations?limit=4&filter=revision-pending&_scope=extended",
};