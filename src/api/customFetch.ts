import store from 'src/store/index'

const catchError = {
  success: false,
  message: {
    en: 'Something went wrong.',
  },
  respCode: '',
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
    return catchError
  }
}

export const fetchGetCall = async (uri: string) => {
  try {
    const token = store.getState().appState.accessToken
    const response = await fetch(`${protocol}${baseUrl}/${uri}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const responseJson = await response.json()
    return responseJson
  } catch (err) {
    return false
  }
}
