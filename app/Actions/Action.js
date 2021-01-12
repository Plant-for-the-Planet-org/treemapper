class LocalInventoryActions {
  static SET_INVENTORY_ID = 'SET_INVENTORY_ID';
  static ADD_INVENTORY = 'ADD_INVENTORY';
  static UPDATE_PENDING_COUNT = 'UPDATE_PENDING_COUNT';
  static UPDATE_UPLOAD_COUNT = 'UPDATE_UPLOAD_COUNT';
  static IS_UPLOADING = 'IS_UPLOADING';

  static setInventoryId = (payload) => ({
    type: LocalInventoryActions.SET_INVENTORY_ID,
    payload: payload,
  });

  static addInventory = (payload) => ({
    type: LocalInventoryActions.ADD_INVENTORY,
    payload: payload,
  });

  static updatePendingCount = (type, count = null) => ({
    type: LocalInventoryActions.UPDATE_PENDING_COUNT,
    payload: { type, count },
  });
  static updateUploadCount = (type, count = null) => ({
    type: LocalInventoryActions.UPDATE_UPLOAD_COUNT,
    payload: { type, count },
  });
  static updateIsUploading = (payload) => ({
    type: LocalInventoryActions.IS_UPLOADING,
    payload,
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
};
