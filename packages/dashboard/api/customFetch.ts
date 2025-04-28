const fetchCall = async (
  method: string,
  uri: string,
  params: any = null,
  authRequire: boolean = true,
  token?: string,
) => {
  try {
    const tokenData = authRequire ? { Authorization: `Bearer ${token}` } : {}
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(authRequire && token ? { Authorization: `Bearer ${token}` } : {}),
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (params) {
      options.body = JSON.stringify(params, (_key, value) =>
        value !== null ? value : {},
      )
    }

    const response = await fetch(uri, options)
    const responseJson = await response.json()
    if (response.status === 303) {
      return {
        response: { signUpRequire: true },
        success: true,
        status: response.status,
        extra: {},
      }
    }
    if (!response.ok) {
      return {
        response: null,
        success: false,
        status: response.status,
        extra: {},
      }
    }

    return {
      response: responseJson,
      success: true,
      status: response.status,
      extra: {},
    }
  } catch (err) {
    return { response: null, success: false, status: 500, extra: {} }
  }
}

export const fetchPostCall = (
  uri: string,
  params: any,
  authRequire?: boolean,
) => fetchCall('POST', uri, params, authRequire)
export const fetchGetCall = (uri: string, authRequire: boolean) =>
  fetchCall('GET', uri, null, authRequire)
export const fetchPutCall = (uri: string, params: any) =>
  fetchCall('PUT', uri, params)
export const fetchDeleteCall = (uri: string) =>
  fetchCall('DELETE', uri, {}, true)
