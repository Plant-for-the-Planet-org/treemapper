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
export { LocalInventoryActions, LoaderActions, SignUpLoader };
