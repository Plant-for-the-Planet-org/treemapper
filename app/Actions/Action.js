class LocalInventoryActions {
  static SET_INVENTORY_ID = 'SET_INVENTORY_ID';

  static setInventoryId = (payload) => ({
    type: LocalInventoryActions.SET_INVENTORY_ID,
    payload: payload,
  });
}

class LoaderActions {
  static SET_LOADING = 'SET_LOADING';

  static setLoader = (payload) => ({
    type: LoaderActions.SET_LOADING,
    payload: payload,
  });
}

class SignUpLoader {
  static SET_SIGNUP_LOADER = 'SET_SIGNUP_LOADER';

  static setSignUpLoader = (payload) => ({
    type: SignUpLoader.SET_SIGNUP_LOADER,
    payload,
  });
}

class SpeciesListAction {
  static SET_SPECIES_LIST = 'SET_SPECIES_LIST';

  static setSpeciesList = (payload) => ({
    type: SpeciesListAction.SET_SPECIES_LIST,
    payload,
  });
}

class UploadAction {
  static SET_UPLOAD_PROGRESS = 'SET_UPLOAD_PROGRESS';

  static setUploadProgess = (payload) => ({
    type: UploadAction.SET_UPLOAD_PROGRESS,
    payload,
  });
}

class UploadCompleteAction {
  static SET_UPLOAD_COMPLETE = 'SET_UPLOAD_COMPLETE';

  static setUploadComplete = (payload) => ({
    type: UploadCompleteAction.SET_UPLOAD_COMPLETE,
    payload,
  });
}
class SpecieIdFromServer {
  static SET_SPECIES_ID = 'SET_SPECIES_ID';

  static setSpecieId = (payload) => ({
    type: SpecieIdFromServer.SET_SPECIES_ID,
    payload,
  });
}
export {
  LocalInventoryActions,
  LoaderActions,
  SignUpLoader,
  SpeciesListAction,
  SpecieIdFromServer,
  UploadAction,
  UploadCompleteAction,
};
