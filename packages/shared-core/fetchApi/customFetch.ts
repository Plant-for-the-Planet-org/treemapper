const fetchCall = async (
  method: string,
  uri: string,
  payload: any = null,
  token?: string,
) => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json', // Add this
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    const options: RequestInit = {
      method,
      headers,
      credentials: 'include', // This is the key addition for CORS
      mode: 'cors', // Explicitly set CORS mode
    }

    if (payload && method !== 'GET') {
      options.body = JSON.stringify(payload)
    }

    const response = await fetch(uri, options)
    // Better error handling
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        message: errorData.message || `HTTP Error: ${response.status}`,
        statusCode: response.status,
        error: errorData.error || 'HTTP Error',
        data: null,
        // Keep the server's own code when it sent one. Hardcoding 'http_error'
        // threw away the only machine-readable reason the caller had, which left
        // the UI matching on message text to tell one failure from another.
        code: errorData.code || 'http_error',
      }
    }

    const responseJson = await response.json()
    return responseJson

  } catch (err) {
    console.error('Error in fetchCall:', err)

    // More specific error handling
    if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
      return {
        message: 'Network error - please check your connection',
        statusCode: 0,
        error: 'Network Error',
        data: null,
        code: 'network_error',
      }
    }

    return {
      message: 'Something went wrong',
      statusCode: 500,
      error: 'Fetch Error',
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
  fetchCall('DELETE', uri, {}, token) // Changed from {} to null

export const fetchPatchCall = (uri: string, payload: any, token?: string) =>
  fetchCall('PATCH', uri, payload, token)