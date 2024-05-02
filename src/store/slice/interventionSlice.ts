import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import { InterventionData } from 'src/types/interface/slice.interface'

const initialState: InterventionData = {
  intervention_id: '',
  intervention_key: '',
  intervention_title: '',
  intervention_date: 0,
  project_id: '',
  project_name: '',
  site_name: '',
  location_type: '',
  location: {
    type: 'Point',
    coordinates: '',
  },
  cover_image_url: '',
  has_species: false,
  species: [],
  has_sample_trees: false,
  sample_trees: [],
  is_complete: false,
  site_id: '',
  form_data: '',
  additional_data: '',
  meta_data: '',
  intervention_type: 'single-tree-registration',
  last_updated_at: 0
}

const interventionSlice = createSlice({
  name: 'interventionSlice',
  initialState,
  reducers: {
    updateInerventionData(_state, action: PayloadAction<InterventionData>) {
      return { ...action.payload }
    },
    updateLastUpdatedAt(state) {
      state.last_updated_at = Date.now()
    },
    updateTreesSpecies(state, action: PayloadAction<{ treeId: string, data: IScientificSpecies }>) {
      const allTress = [...state.sample_trees]
      const index = allTress.findIndex(el => el.tree_id === action.payload.treeId);
      allTress[index].specie_name = action.payload.data.scientific_name;
      allTress[index].species_guid = action.payload.data.guid;
      state.sample_trees = [...allTress]
      state.last_updated_at =  Date.now()
    },
  },
})

export const { updateInerventionData, updateLastUpdatedAt, updateTreesSpecies } = interventionSlice.actions

export default interventionSlice.reducer
