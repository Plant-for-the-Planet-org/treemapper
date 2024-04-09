import {AFTER_CAPTURE, INTERVENTION_TYPE} from './app.type'

export type BottomTabParamList = {
  Map: undefined
  Interventions: undefined
  Plots: undefined
  Add: undefined
}

export type RootStackParamList = {
  Home: undefined
  SingleTreeRegister: undefined
  TakePicture: TakePictureView
  PolygonMarker: undefined
  SyncSpecies: undefined
  HomeSideDrawer: undefined
  PreviewFormData: undefined
  ManageSpecies: ManageSpeciesView
  SpeciesInfo: SpeciesInfoView
  SpeciesSearch: undefined
  PointMarker: undefined
  DynamicForm: undefined
  InterventionForm: IntermediateFormView
  AddMeasurment: undefined
  ReviewSampleTree: undefined
  TotalTrees: TotalTreesView
}

type SpeciesInfoView = {
  guid: string
}

type TakePictureView = {
  id: string
  screen: AFTER_CAPTURE
}

type IntermediateFormView = {
  id: INTERVENTION_TYPE
}

type ManageSpeciesView = {
  isSelectSpecies: boolean
}
type TotalTreesView = {
  isSelectSpecies: boolean
}
