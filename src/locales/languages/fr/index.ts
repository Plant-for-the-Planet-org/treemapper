import SignUp from './authentication/signUplabels.json';
import InitialScreen from './static/initialScreen.json';
import Permission from './static/permission.json';
import WelcomeScreen from './static/welcomeScreen.json';
import DownloadMap from './user/downloadMap.json';
import EditUserProfile from './user/editUserProfilelabels.json';
import InventoryOverview from './user/inventoryOverview.json';
import LocateTree from './user/locateTree.json';
import Logs from './user/logs.json';
import ManageUser from './user/manageUser.json';
import RegisterTree from './user/registerTreeslabels.json';
import SavedAreas from './user/savedAreas.json';
import SelectSpecies from './user/selectSpecies.json';
import MapMarking from './user/mapMarking.json';
import TreeInventory from './user/treeInventory.json';
import Review from './user/treeReview.json';
import SampleTrees from './user/sampleTrees.json';
import SpeciesSyncError from './user/speciesSyncError.json';
import AdditionalData from './user/additionalData.json';
import Projects from './user/projects.json';
import Intervention from './user/intervention.json'
export default {
  ...WelcomeScreen,
  ...SignUp,
  ...RegisterTree,
  ...LocateTree,
  ...TreeInventory,
  ...EditUserProfile,
  ...InventoryOverview,
  ...DownloadMap,
  ...ManageUser,
  ...SavedAreas,
  ...Permission,
  ...Review,
  ...SelectSpecies,
  ...InitialScreen,
  ...Logs,
  ...SampleTrees,
  ...MapMarking,
  ...SpeciesSyncError,
  ...AdditionalData,
  ...Projects,
  ...Intervention,
};
