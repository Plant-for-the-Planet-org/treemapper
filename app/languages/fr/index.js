import WelcomeScreen from './static/welcomeScreen.json';
import InitialScreen from './static/initialScreen.json';
import SignUp from './authentication/signUplabels.json';
import RegisterTree from './user/registerTreeslabels.json';
import LocateTree from './user/locateTree.json';
import TreeInventory from './user/treeInventory.json';
import EditUserProfile from './user/editUserProfilelabels.json';
import InventoryOverview from './user/inventoryOverview.json';
import DownloadMap from './user/downloadMap.json';
import ManageUser from './user/manageUser.json';
import SavedAreas from './user/savedAreas.json';
import Permission from './static/permission.json';
import Review from './user/treeReview.json';
import SelectSpecies from './user/selectSpecies.json';

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
};
