import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ModalState {
  isOpen?: boolean;
  heading: string;
  message: string;
  primaryButtonText: string;
  showSecondaryButton: boolean;
  secondaryButtonText: string;
}

const initialState: ModalState = {
  isOpen: false,
  heading: '',
  message: '',
  primaryButtonText: '',
  showSecondaryButton: false,
  secondaryButtonText: '',
};

export const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    openModal: (state, action: PayloadAction<ModalState>) => {
      state.heading = action.payload.heading;
      state.message = action.payload.message;
      state.primaryButtonText = action.payload.primaryButtonText;
      state.showSecondaryButton = action.payload.showSecondaryButton;
      if (action.payload.showSecondaryButton) {
        state.secondaryButtonText = action.payload.secondaryButtonText;
      }
      state.isOpen = true;
    },
    closeModal: state => {
      state = initialState;
    },
  },
});

// Action creators are generated for each case reducer function
export const { openModal, closeModal } = modalSlice.actions;

export default modalSlice.reducer;
