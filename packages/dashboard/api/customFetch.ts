const fetchCall = async (
  method: string,
  uri: string,
  payload: any = null,
  token?: string,
) => {
  console.log("Making API call", uri, payload, token)
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (payload) {
      options.body = JSON.stringify(payload, (_key, value) =>
        value !== null ? value : {},
      )
    }
    const response = await fetch(uri, options)
    const responseJson = await response.json()
    return responseJson
  } catch (err) {
    console.error('Error in fetchCall:', err)
    return {
      message: 'Something went wrong',
      statusCode: 500,
      error: 'Fethch Error',
      data: null,
      code: 'client_fetch_error',
    }
  }
}

export const fetchPostCall = (
  uri: string,
  payload: any,
  token?: string,
) => fetchCall('POST', uri, payload, token)

export const fetchGetCall = (uri: string, token?: string) =>
  fetchCall('GET', uri, null, token)

export const fetchPutCall = (uri: string, payload: any, token?: string) =>
  fetchCall('PUT', uri, payload, token)

export const fetchDeleteCall = (uri: string, token?: string) =>
  fetchCall('DELETE', uri, {}, token)
