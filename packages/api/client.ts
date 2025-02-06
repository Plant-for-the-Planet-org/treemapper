import { storage } from './storage';
import { ApiConfig, ApiResponse } from './types';

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await storage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async fetchWithAuth<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const authHeaders = await this.getAuthHeader();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...authHeaders,
        ...options.headers,
      },
    });

    const data = await response.json();

    return {
      data,
      status: response.status,
    };
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, { method: 'DELETE' });
  }
}