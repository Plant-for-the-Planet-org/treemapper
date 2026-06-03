import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SyncInfoData, TempStateSlice } from 'src/types/interface/slice.interface'

const initialState: TempStateSlice = {
  webAuthLoading: false,
  synData: [],
  selectedId: '',
  speciesDownloading: false,
  speciesWriting: false,
  speciesUpdatedAt: 0,
  inviteId: '',
  handledInviteIds: [],
  refreshProject: '',
}

const tempStateSlice = createSlice({
  name: 'tempStateSlice',
  initialState,
  reducers: {
    updateWebAuthLoading(state, action: PayloadAction<boolean>) {
      state.webAuthLoading = action.payload
    },
    initSyncData(state, action: PayloadAction<SyncInfoData[]>) {
      state.synData = action.payload
    },
    updateSelectedSpeciesId(state, action: PayloadAction<string>) {
      state.selectedId = action.payload
    },
    updateSpeciesDownloading(state, action: PayloadAction<boolean>) {
      state.speciesDownloading = action.payload
    },
    updateSpeciesWriting(state, action: PayloadAction<boolean>) {
      state.speciesWriting = action.payload
    },
    updateSpeciesUpdatedAt(state) {
      state.speciesUpdatedAt = Date.now()
    },
    updateInviteId(state, action: PayloadAction<string>) {
      // Skip invites the user already accepted/declined this session. The OS
      // keeps returning the launch deep link from getInitialURL(), so without
      // this guard a navigation reset would re-open the modal for a handled invite.
      if (action.payload && state.handledInviteIds.includes(action.payload)) {
        return
      }
      state.inviteId = action.payload
    },
    markInviteHandled(state, action: PayloadAction<string>) {
      if (action.payload && !state.handledInviteIds.includes(action.payload)) {
        state.handledInviteIds.push(action.payload)
      }
      state.inviteId = ''
    },
    updateRefeshProject(state) {
      state.refreshProject = new Date().toISOString()
    },
  },
})

export const { updateSpeciesWriting, updateWebAuthLoading, initSyncData, updateSelectedSpeciesId, updateSpeciesDownloading, updateSpeciesUpdatedAt, updateInviteId, markInviteHandled, updateRefeshProject } = tempStateSlice.actions

export default tempStateSlice.reducer
