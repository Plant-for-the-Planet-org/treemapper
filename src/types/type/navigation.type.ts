import { AFTER_CAPTURE, INTERVENTION_TYPE } from './app.type'

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