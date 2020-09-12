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
    payload: payload
  });
}

class SignUpLoader {
  static SET_SIGNUP_LOADER = 'SET_SIGNUP_LOADER';

  static setSignUpLoader = (payload) => ({
    type: SignUpLoader.SET_SIGNUP_LOADER,
    payload
  });
}

class UploadAction{
  static SET_UPLOAD_PROGRESS = 'SET_UPLOAD_PROGRESS';

  static setUploadProgess = (payload) => ({
    type: UploadAction.SET_UPLOAD_PROGRESS,
    payload
  })
}

class UploadCompleteAction {
  static SET_UPLOAD_COMPLETE = 'SET_UPLOAD_COMPLETE';

  static setUploadComplete = (payload) => ({
    type: UploadCompleteAction.SET_UPLOAD_COMPLETE,
    payload
  })
}
export { LocalInventoryActions, LoaderActions, SignUpLoader, UploadAction, UploadCompleteAction };
