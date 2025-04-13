import { storage } from './storage'
import { ApiConfig, ApiResponse } from './types'

export class ApiClient {
  private static instance: ApiClient
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  private constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    }
  }

  public static initialize(config: ApiConfig): void {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient(config)
    }
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      throw new Error('ApiClient must be initialized before use')
    }
    return ApiClient.instance
  }

  private async getAuthHeader(): Promise<Record<string, string>> {
    try {
      const token = await storage.getItem('auth_token')
      console.log({ token })
      const headers: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {}
      return headers
    } catch (error) {
      throw error
    }
  }

  private async fetchWithAuth<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const authHeaders = await this.getAuthHeader()
      const fullUrl = `${this.baseUrl}${endpoint}`
      // console.debug('Full URL', fullUrl, '\n', 'Token', authHeaders)
      const requestOptions: RequestInit = {
        ...options,
        credentials: 'include', // Add this for CORS
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...this.defaultHeaders,
          ...authHeaders,
          ...options.headers,
        },
      }

      const response = await fetch(fullUrl, requestOptions).catch(error => {
        throw error
      })
      if (!response.ok) {
        const errorText = await response.text()
        return {
          data: null,
          success: false,
          status: response.status,
          error: `Request failed: ${errorText}`,
        }
      }
      const rawResponse = await response.text()
      let responseJson
      try {
        responseJson = JSON.parse(rawResponse)
        return {
          data: responseJson,
          success: true,
          status: response.status,
          error: null,
        }
      } catch (parseError) {
        return {
          data: null,
          success: false,
          status: response.status,
          error: 'Invalid JSON response from server',
        }
      }
    } catch (error) {
      return {
        data: null,
        success: false,
        status: 500,
        error:
          error instanceof Error
            ? `${error.name}: ${error.message}`
            : 'An unexpected error occurred',
      }
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const result = await this.fetchWithAuth<T>(endpoint, { method: 'GET' })
    return result
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, { method: 'DELETE' })
  }
}
