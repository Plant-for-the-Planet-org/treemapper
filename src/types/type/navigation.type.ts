import { AFTER_CAPTURE, FORM_TYPE, INTERVENTION_TYPE } from './app.type'

export type BottomTabParamList = {
  Map: undefined
  Interventions: undefined
  Plots: undefined
  Add: undefined
}

export type RootStackParamList = {
  Home: undefined
  TakePicture: TakePictureView
  PolygonMarker: PolygonMarkerView
  HomeSideDrawer: undefined
  InterventionPreview: InterventionPreviewView
  ManageSpecies: ManageSpeciesView
  SpeciesInfo: SpeciesInfoView
  SpeciesSearch: SearchSpeciesView
  PointMarker: PointMarkerView
  DynamicForm: LocalFormView
  InterventionForm: IntermediateFormView
  AddMeasurement: undefined
  TotalTrees: TotalTreesView
  ManageProjects: undefined
  DataExplorer: undefined
  AdditionalData: undefined
  OfflineMap: undefined
  OfflineMapSelection: undefined
  ReviewTreeDetails: ReviewTreeDetailsView
  ActivityLog: undefined
  MetaDataElement: MetaDataElementView
  AdditionDataElement: AdditionDataElementView
  SelectElement: SelectElementView
  LocalForm: LocalFormView
  ImportForm: undefined
  EditAdditionData: EditAdditionDataView
  EditPolygon: EditPolygonView
  CreatePlot: undefined
  CreatePlotDetail: CreatePlotDetails
  CreatePlotMap: CreatePlotMap
  PlotDetails: PlotDetails
  PlotPlantRemeasure: PlotPlantDetails
  AddObservationForm: AddObservation
  AddPlantDetailsPlot: AddPlantDetailsPlot
  MonitoringInfo: undefined
  AddRemeasurement: AddRemeasurementView
  PlotGroup: undefined
  AddPlotGroup: AddPlotGroup,
  AddPlotsToGroup: AddPlotsToGroup,
  TreeRemeasurement: TreeRemeasurementView
  ProjectRemeasurementConfig: ProjectRemeasurementConfig
  OldInventoryDataView: undefined,
  EditProject: EditProjectView,
  SignUpPage: SignUpPage,
  PlantHistory: PlantHistory,
  ProjectSites: undefined
  DeleteAccount: undefined
}

type SpeciesInfoView = {
  guid: string
}

type TakePictureView = {
  id: string
  screen: AFTER_CAPTURE
}

type IntermediateFormView = {
  id?: INTERVENTION_TYPE
}

type InterventionPreviewView = {
  id: 'preview' | 'review'
  intervention: string
  sampleTree?: string,
  interventionId: string
}

type SignUpPage = {
  email: string,
  accessToken: string
}

type PlantHistory = {
  id: string,
}


type ManageSpeciesView = {
  manageSpecies: boolean
  reviewTreeSpecies?: string
  id?: string
  selectedId?: string
  multiTreeEdit?: boolean
}
type TotalTreesView = {
  isSelectSpecies: boolean
  interventionId: string
  isEditTrees?: boolean
  treeId?: string
}

type ReviewTreeDetailsView = {
  detailsCompleted: boolean
  interventionID?: string
  synced?: boolean
  id: string
  deleteTree?: boolean
}

type SearchSpeciesView = {
  manageSpecies: boolean
}

type MetaDataElementView = {
  order: number
  edit?: boolean
  id?: string
}

type EditProjectView = {
  interventionId: string
  siteId: string
  projectId: string
}

type AdditionDataElementView = {
  edit?: boolean,
  element: FORM_TYPE,
  element_id?: string
  form_id: string
  element_order: number
}

type SelectElementView = {
  form_id: string
  element_order: number
}

type EditAdditionDataView = {
  interventionID: string
}

type PointMarkerView = {
  id: string
}
type PolygonMarkerView = {
  id: string
}
type LocalFormView = {
  id: string
}

type CreatePlotDetails = {
  id: string,
  isEdit?: boolean
}

type EditPolygonView = {
  id: string
}

type CreatePlotMap = {
  id: string,
  markLocation?: boolean,
  plantId?: string,
  isEdit?: boolean
}
type PlotDetails = {
  id: string
}

type AddPlantDetailsPlot = {
  id: string,
  isEdit?: boolean
  plantId?: string
}

type PlotPlantDetails = {
  id: string,
  plantID: string,
  timelineId?: string
}


type AddRemeasurementView = {
  id: string,
  plantID: string
  timelineId?: string
}

type AddObservation = {
  id: string
  obsId?: string
}

type AddPlotGroup = {
  isEdit: boolean,
  groupId: string
}

type AddPlotsToGroup = {
  groupId: string
}

type TreeRemeasurementView = {
  interventionId: string
  treeId: string
  isEdit?: boolean
  historyId?: string
}
type ProjectRemeasurementConfig = {
  id: string
}
