import { AFTER_CAPTURE } from "./app.type"

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
  ManageSpecies: undefined
  SpeciesInfo: SpeciesInfoView
  SpeciesSearch: undefined
}

type SpeciesInfoView = {
  guid: string
}

type TakePictureView = {
  id: string
  screen: AFTER_CAPTURE
}
