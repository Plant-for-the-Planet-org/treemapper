import HomeMapView from './HomeMapView'
import Interventions from './InterventionView'
import PlotView from './PlotView'
import HomeSideDrawer from './HomeSideDrawer'
import InterventionFormView from './InterventionFormView'
import PolygonMarker from './PolygonMarkerView'
import PointMarkerView from './PointMarkerView'
import TakePicture from './TakePictureView'
import InterventionPreview from './InterventionPreviewView'
import ManageSpeciesView from './ManageSpeciesView'
import SpeciesInfoView from './SpeciesInfoView'
import SpeciesSearchView from './SpeciesSearchView'
import TotalTreesView from './TotalTreesView'
import AddMeasurementView from './AddMeasurementView'
import DynamicFormView from './DynamicFormView'
import ManageProjectsView from './ManageProjectsView'
import DataExplorerView from './DataExplorerView'
import OfflineMapSelectionView from './OfflineMapSelectionView'
import OfflineMapView from './OfflineMapView'
import ReviewTreeDetails from './ReviewTreeDetails'
import ActivityLogsView from './ActivityLogsView'
import EditAdditionData from './EditAdditionDataView'
import AddInterventionDataView from './AddInterventionDataView'
import EditPolygonView from './EditPolygonView'
import CreatePlotView from './CreatePlotView'
import CreatePlotDetailsView from './CreatePlotDetailsView'
import CreatePlotMapView from './CreatePlotMapView'
import PlotDetailsView from './PlotDetailsView'
import PlotPlantRemeasureView from './PlotPlantRemeasureView'
import AddPlantDetailsPlotView from './AddPlantDetailsPlotView'
import AddPlotDetailsView from './AddPlotDetailsView'
import MonitoringInfoView from './MonitoringInfoView';
import AddRemeasurementView from './AddRemeasurementView'
import PlotGroupView from './PlotGroupView';
import AddObservationFormView from './AddObservationFormView'
import AddPlotGroupView from './AddPlotGroupView'
import AddPlotsToGroupView from './AddPlotToGroupView'
import TreeRemeasurement from './TreeRemeasurementView'
import OldInventoryDataView from './OldInventoryDataView'
import EditProjectView from './EditProjectView'
import PlantHistory from './PlantHistoryView'
import ProjectSites from './ProjectSitesView'
import DeleteAccount from './DeleteAccount'
import CreateProjectScreen from './CreateProject'
import GuideView from './GuideView'
import NotificationView from './NotificationView'
import NotificationDetailView from './NotificationDetailView'
import LanguageSettingsView from './LanguageSettingsView'
import PlotGalleryView from './PlotGalleryView'
import PlannedTreeEditView from './PlannedTreeEditView'
import PlannedTreeLocationView from './PlannedTreeLocationView'
import FormsView from './FormsView'
import FormDetailView from './FormDetailView'

export default {
  HomeMapView: HomeMapView,
  Interventions: Interventions,
  PlotView: PlotView,
  TakePicture: TakePicture,
  PolygonMarker: PolygonMarker,
  HomeSideDrawer: HomeSideDrawer,
  ManageSpecies: ManageSpeciesView,
  SpeciesInfo: SpeciesInfoView,
  SpeciesSearch: SpeciesSearchView,
  PointMarker: PointMarkerView,
  DynamicForm: DynamicFormView,
  InterventionForm: InterventionFormView,
  AddMeasurement: AddMeasurementView,
  TotalTrees: TotalTreesView,
  ManageProjects: ManageProjectsView,
  DataExplore: DataExplorerView,
  InterventionPreview: InterventionPreview,
  OfflineMap: OfflineMapView,
  OfflineMapSelection: OfflineMapSelectionView,
  ReviewTreeDetails: ReviewTreeDetails,
  ActivityLogs: ActivityLogsView,
  // Additional Data is retired: AdditionalDataView, MetaDataElementView,
  // AdditionDataElement, SelectElementView, LocalFormView and ImportFormView
  // are no longer reachable. EditAdditionData still edits the built-in
  // intervention form.
  EditAdditionData: EditAdditionData,
  AddInterventionData: AddInterventionDataView,
  EditPolygon: EditPolygonView,
  CreatePlot: CreatePlotView,
  CreatePlotDetail: CreatePlotDetailsView,
  CreatePlotMap: CreatePlotMapView,
  PlotDetails: PlotDetailsView,
  PlotPlantRemeasure: PlotPlantRemeasureView,
  AddPlantDetailsPlot: AddPlantDetailsPlotView,
  AddPlotDetails: AddPlotDetailsView,
  MonitoringInfo: MonitoringInfoView,
  AddRemeasurement: AddRemeasurementView,
  PlotGroup: PlotGroupView,
  AddObservationForm: AddObservationFormView,
  AddPlotGroup: AddPlotGroupView,
  AddPlotsToGroup: AddPlotsToGroupView,
  TreeRemeasurement: TreeRemeasurement,
  OldInventoryData: OldInventoryDataView,
  EditProjectView: EditProjectView,
  PlantHistory:PlantHistory,
  ProjectSites:ProjectSites,
  DeleteAccount: DeleteAccount,
  CreateProject:CreateProjectScreen,
  Guide: GuideView,
  Notification: NotificationView,
  NotificationDetail: NotificationDetailView,
  Language: LanguageSettingsView,
  PlotGallery: PlotGalleryView,
  PlannedTreeEdit: PlannedTreeEditView,
  PlannedTreeLocation: PlannedTreeLocationView,
  Forms: FormsView,
  FormDetail: FormDetailView,
}
