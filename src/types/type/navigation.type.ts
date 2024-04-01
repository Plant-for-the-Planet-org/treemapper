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
  CreatePolygon: undefined
  SyncSpecies: undefined
  HomeSideDrawer: undefined
  SelectSpecies: undefined
  AddMeasurment: undefined
  PreviewFormData: undefined
  ManageSpecies: ManageSpeciesView
  SpeciesInfo: SpeciesInfoView
  SpeciesSearch: undefined
  FormIntermediate: FormIntermediateView
  PointMarker: undefined
  DynamicForm: undefined
}

type SpeciesInfoView = {
  guid: string
}

type TakePictureView = {
  id: string
  screen: AFTER_CAPTURE
}

type FormIntermediateView = {
  id: INTERVENTION_TYPE
}

type ManageSpeciesView = {
  isSelectSpecies: boolean
}
