import AsyncStorage from '@react-native-async-storage/async-storage'

export const updateLocalSpeciesSync = async () => {
  try {
    await AsyncStorage.setItem('localSpeciesSync', `${new Date().getTime()}`)
    return true
  } catch (err) {
    //error occured return false
    return false
  }
}

export const getLocalSpeciesSync = async () => {
  try {
    const speciesTimeStamp = await AsyncStorage.getItem('localSpeciesSync')
    return speciesTimeStamp
  } catch (err) {
    //error occured return ''
    return ''
  }
}

export const checkForMigrateSpecies = async () => {
  try {
    const speciesDataPresent = await AsyncStorage.getItem('isLocalSpeciesUpdated')
    return speciesDataPresent
  } catch (err) {
    //error occured return ''
    return false
  }
}

