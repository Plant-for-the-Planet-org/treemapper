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
  PolygonMarker: undefined
  SyncSpecies: SyncSpeciesView
  HomeSideDrawer: undefined
  InterventionPreview: InterventionPreviewView
  ManageSpecies: ManageSpeciesView
  SpeciesInfo: SpeciesInfoView
  SpeciesSearch: SearchSpeciesView
  PointMarker: undefined
  DynamicForm: undefined
  InterventionForm: IntermediateFormView
  AddMeasurment: undefined
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
  LocalForm: undefined
  ImportForm: undefined
  EditAdditionData: EditAdditionDataView
  EditPolygon: undefined
  CreatePlot: undefined
  CreatePlotDetail: undefined
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
  sampleTree?: string
}


type SyncSpeciesView = {
  inApp?: boolean
}


type ManageSpeciesView = {
  manageSpecies: boolean
  reviewTreeSpecies?: string
}
type TotalTreesView = {
  isSelectSpecies: boolean
}

type ReviewTreeDetailsView = {
  detailsCompleted: boolean
  interventionID?: string
  synced?: boolean
}

type SearchSpeciesView = {
  manageSpecies: boolean
}

type MetaDataElementView = {
  order: number
  edit?: boolean
  id?: string
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