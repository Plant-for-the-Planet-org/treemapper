const baseUrl = process.env.EXPO_PUBLIC_API_ENDPOINT
const testURL = process.env.EXPO_PUBLIC_TESTING_URL

const https = 'https://'

export const postUrlApi = {
  uploadIntervention: `${https}${baseUrl}/treemapper/interventions`,
  imageUpload: `${https}${baseUrl}/treemapper/interventions`,
  remeasurement: `${https}${baseUrl}/treemapper/interventions`,
  updateSpecies: `${https}${baseUrl}/treemapper/species`,
  addUserSpecies: `${https}${baseUrl}/treemapper/species`,
  updatePlantLocationData: `${https}${baseUrl}/treemapper/interventions`,
  signupService: `${https}${baseUrl}/app/profile`,
  updateProjectInF: `${https}${baseUrl}/app/projects`,
};

export const getUrlApi = {
  getBaseUrl: `${https}${baseUrl}`,
  getBaseTestUrl: `${https}${testURL}`,
  getUserDetails: `${https}${baseUrl}/app/profile`,
  getAllPlantLocations: `${https}${testURL}/treemapper/plantLocations?limit=10&_scope=extended`,
  getAllProjects: `${https}${baseUrl}/app/profile/projects?_scope=extended`,
  userSpecies: `${https}${baseUrl}/treemapper/species`,
  getAreaName: `https://api.mapbox.com/geocoding/v5/mapbox.places`,
  getSingleLocationDetail: `${https}${baseUrl}/treemapper/plantLocations`,
  getAllSpeciesAchieve: `${https}${baseUrl}/treemapper/scientificSpeciesArchive`,
  getNecessaryInventoryFromServer: "/treemapper/plantLocations?limit=4&filter=revision-pending&_scope=extended",
};