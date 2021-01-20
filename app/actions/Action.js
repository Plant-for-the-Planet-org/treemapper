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
export { SignUpLoader, SpeciesListAction, SpecieIdFromServer };
