const baseUrl = process.env.EXPO_PUBLIC_API_ENDPOINT
const testingURL = process.env.EXPO_PUBLIC_TESTING_URL
// const http = 'http://'
const https = 'https://'

export const postUrlApi = {
  uploadIntervention: `${https}${testingURL}/treemapper/interventions`,
  imageUpload: `${https}${testingURL}/treemapper/interventions`,
  remeasurment: `${https}${testingURL}/treemapper/interventions`,
  updateSpecies:  `${https}${baseUrl}/treemapper/species`,
  addUserSpecies: `/treemapper/species`, //POST
  updatePlantLocationData: `${https}${testingURL}/treemapper/interventions`,
  signupService:"/app/profile",
  updateProjectInF: "/app/projects" //PUT `/app/projects/${projectId}`
};

export const getUrlApi = {
  getBaseUrl:  `${https}${baseUrl}`,
  getUserDetails: `${https}${baseUrl}/app/profile`,
  getAllPlantLocations: `${https}${baseUrl}/treemapper/plantLocations?limit=10&_scope=extended`,
  getAllProjects: `${https}${baseUrl}/app/profile/projects?_scope=extended`,
  userSpecies: `${https}${baseUrl}/treemapper/species`,
  getAreaName: `https://api.mapbox.com/geocoding/v5/mapbox.places`,
  getSingleLocationDetail: `${https}${baseUrl}/treemapper/plantLocations`,
  getAllSpeciesArchieve:`${https}${baseUrl}/treemapper/scientificSpeciesArchive`,
  getNecessaryInventoryFromServer:"/treemapper/plantLocations?limit=4&filter=revision-pending&_scope=extended",
};