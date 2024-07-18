import store from 'src/store/index'
import 'react-native-get-random-values'
import { v4 as uuidv4 } from 'uuid'

const defaultHeaders = {
  "x-accept-versions": "1.0.3",
  "x-session-id": uuidv4(),
  "Content-Type": "application/json",
  "User-Agent": "treemapper/android/1.0.11"
}

const baseUrl = process.env.EXPO_PUBLIC_API_ENDPOINT
const protocol = 'https://'
export const fetchPostCall = async (uri: string, params: any) => {
  try {
    const token = store.getState().appState.accessToken
    const formBody = JSON.stringify(params, (_key, value) => {
      if (value !== null) {
        return value
      }
      return {}
    })
    const response = await fetch(`${protocol}${baseUrl}/${uri}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: formBody,
    })
    const responseJson = await response.json()
    return responseJson
  } catch (err) {
    console.log("KLJ",err)
    return null
  }
}

export const tempPostFetch = async (uri: string, params: any) => {
  try {
    const token = store.getState().appState.accessToken
    const formBody = JSON.stringify(params, (_key, value) => {
      if (value !== null) {
        return value
      }
      return {}
    })
    const response = await fetch(uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: formBody,
    })
    const responseJson = await response.json()
    return responseJson.response
  } catch (err) {
    return null
  }
}


export const fetchGetCall = async (uri: string) => {
  try {
    const token = store.getState().appState.accessToken
    const response = await fetch(`${protocol}${baseUrl}/${uri}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        ...defaultHeaders,
      },
    })
    const responseJson = await response.json()
    return responseJson
  } catch (err) {
    return null
  }
}
