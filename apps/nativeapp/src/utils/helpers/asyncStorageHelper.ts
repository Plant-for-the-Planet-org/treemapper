import AsyncStorage from '@react-native-async-storage/async-storage'

export const updateLocalSpeciesSync = async () => {
  try {
    await AsyncStorage.setItem('localSpeciesSync', `${new Date().getTime()}`)
    return true
  } catch (err) {
    return false
  }
}

export const getLocalSpeciesSync = async () => {
  try {
    const speciesTimeStamp = await AsyncStorage.getItem('localSpeciesSync')
    return speciesTimeStamp
  } catch (err) {
 return ''
  }
}

export const checkForMigrateSpecies = async () => {
  try {
    const speciesDataPresent = await AsyncStorage.getItem('isLocalSpeciesUpdated')
    return speciesDataPresent
  } catch (err) {
    return false
  }
}

export const setLocalAuthToken = async (token:string) => {
  try {
    await AsyncStorage.setItem('auth_token', token)
    return true
  } catch (err) {
    return false
  }
}